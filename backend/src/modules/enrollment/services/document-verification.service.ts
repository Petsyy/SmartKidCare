import crypto from "crypto";
import sharp, { type Metadata } from "sharp";
import { z } from "zod";
import {
  AIServiceError,
  observeDocumentImage,
} from "../../ai/services/core/gemini.service";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { documentVerificationRepository } from "../repositories/document-verification.repository";
import { verifyDocumentBodySchema } from "../validators/document-verification.validator";
import type {
  DetectedType,
  DocumentType,
  GeminiDocumentObservations,
  VerificationStatus,
} from "../types/document-verification.types";

const observationsSchema = z
  .object({
    documentVisible: z.boolean(),
    detectedType: z.enum([
      "birth_certificate",
      "government_id",
      "other_document",
      "person_photo",
      "unrelated_image",
      "unknown",
    ]),
    readable: z.boolean(),
    cropped: z.boolean(),
    glare: z.boolean(),
    blurred: z.boolean(),
    rotated: z.boolean(),
    confidence: z.number().min(0).max(1),
    extractedFields: z
      .object({
        childFullName: z.string().nullable().optional(),
        dateOfBirth: z.string().nullable().optional(),
        parentFullName: z.string().nullable().optional(),
        parentFirstName: z.string().nullable().optional(),
        parentMiddleName: z.string().nullable().optional(),
        parentLastName: z.string().nullable().optional(),
      })
      .strict(),
    reasonCodes: z.array(z.string().max(80)).max(12),
  })
  .strict();

const detectedTypeAliases: Record<string, DetectedType> = {
  birth_certificate: "birth_certificate",
  certificate_of_live_birth: "birth_certificate",
  government_id: "government_id",
  government_issued_id: "government_id",
  national_id: "government_id",
  philid: "government_id",
  ephilid: "government_id",
  digital_national_id: "government_id",
  philippine_national_id: "government_id",
  other_document: "other_document",
  person_photo: "person_photo",
  selfie: "person_photo",
  unrelated_image: "unrelated_image",
  unknown: "unknown",
};

export class DocumentVerificationService {
  public parseGeminiDocumentObservations(
    raw: string,
  ): GeminiDocumentObservations {
    const parsed = JSON.parse(
      raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""),
    );
    const quality =
      parsed?.quality && typeof parsed.quality === "object" ? parsed.quality : {};
    const extracted =
      parsed?.extractedFields && typeof parsed.extractedFields === "object"
        ? parsed.extractedFields
        : {};
    return observationsSchema.parse({
      documentVisible: parsed.documentVisible,
      detectedType:
        detectedTypeAliases[
          String(parsed.detectedType || "")
            .trim()
            .toLowerCase()
        ] || "unknown",
      readable: parsed.readable ?? quality.readable,
      cropped: parsed.cropped ?? quality.cropped ?? false,
      glare: parsed.glare ?? quality.glare ?? false,
      blurred: parsed.blurred ?? quality.blurred ?? quality.tooBlurry ?? false,
      rotated: parsed.rotated ?? quality.rotated ?? false,
      confidence: parsed.confidence,
      extractedFields: {
        childFullName: extracted.childFullName ?? extracted.childName ?? null,
        dateOfBirth: extracted.dateOfBirth ?? extracted.birthDate ?? null,
        parentFullName:
          extracted.parentFullName ??
          extracted.parentName ??
          extracted.holderName ??
          null,
        parentFirstName:
          extracted.parentFirstName ??
          extracted.givenName ??
          extracted.firstName ??
          null,
        parentMiddleName:
          extracted.parentMiddleName ?? extracted.middleName ?? null,
        parentLastName:
          extracted.parentLastName ??
          extracted.surname ??
          extracted.lastName ??
          null,
      },
      reasonCodes: Array.isArray(parsed.reasonCodes)
        ? parsed.reasonCodes.map(String).slice(0, 12)
        : [],
    });
  }

  private envNumber(
    name: string,
    fallback: number,
    min: number,
    max: number,
  ) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value >= min && value <= max
      ? value
      : fallback;
  }

  private policyVersion() {
    return String(process.env.DOCUMENT_VERIFICATION_POLICY_VERSION || "4");
  }

  private modelVersion() {
    return String(process.env.GEMINI_DOCUMENT_MODEL || "gemini-2.5-flash");
  }

  private hash(value: Buffer | string) {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  public normalizeVerificationName(value: string) {
    return value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private canonicalExpected(body: any) {
    return body.documentType === "birthCertificate"
      ? {
          childFullName: this.normalizeVerificationName(body.childFullName),
          dateOfBirth: body.dateOfBirth,
        }
      : body.parentFirstName && body.parentLastName
        ? {
            parentFirstName: this.normalizeVerificationName(body.parentFirstName),
            parentMiddleName: this.normalizeVerificationName(
              body.parentMiddleName || "",
            ),
            parentLastName: this.normalizeVerificationName(body.parentLastName),
          }
        : {
            parentFullName: this.normalizeVerificationName(body.parentFullName || ""),
          };
  }

  public buildExpectedFieldsHash(body: any) {
    return this.hash(JSON.stringify(this.canonicalExpected(body)));
  }

  private editDistance(a: string, b: string) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const old = row[j];
        row[j] = Math.min(
          row[j] + 1,
          row[j - 1] + 1,
          prev + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
        prev = old;
      }
    }
    return row[b.length];
  }

  public fuzzyMatch(left?: string | null, right?: string | null) {
    const a = this.normalizeVerificationName(left || "");
    const b = this.normalizeVerificationName(right || "");
    if (!a || !b) return false;
    if (a === b) return true;
    const sortedTokens = (value: string) =>
      value.split(" ").filter(Boolean).sort().join(" ");
    if (sortedTokens(a) === sortedTokens(b)) return true;
    return this.editDistance(a, b) / Math.max(a.length, b.length) <= 0.15;
  }

  private componentMatch(
    observedComponent: string | null | undefined,
    observedFullName: string | null | undefined,
    expectedComponent: string,
  ) {
    if (this.fuzzyMatch(observedComponent, expectedComponent)) return true;
    const observedTokens = this.normalizeVerificationName(observedFullName || "")
      .split(" ")
      .filter(Boolean);
    const expectedTokens = this.normalizeVerificationName(expectedComponent)
      .split(" ")
      .filter(Boolean);
    return (
      expectedTokens.length > 0 &&
      expectedTokens.every((expectedToken) =>
        observedTokens.some((observedToken) =>
          this.fuzzyMatch(observedToken, expectedToken),
        ),
      )
    );
  }

  private toResponse(record: any) {
    return {
      verificationId: String(record._id),
      status: record.status,
      detectedType: record.detectedType,
      confidence: record.confidence ?? null,
      reasonCodes: record.reasonCodes || [],
      fieldMatches: record.fieldMatches || {},
      teacherConfirmed: Boolean(record.teacherConfirmed),
      message:
        record.status === "verified" && record.documentType === "parentId"
          ? "National ID and parent name verified."
          : record.status === "verified"
            ? "Document image verified for enrollment."
            : record.status === "rejected"
              ? "This image cannot be used for the required document."
              : record.reasonCodes?.includes(
                    "PARENT_FIRST_NAME_MISMATCH_OR_UNREADABLE",
                  ) &&
                  record.reasonCodes?.includes(
                    "PARENT_LAST_NAME_MISMATCH_OR_UNREADABLE",
                  )
                ? "National ID recognized, but the parent name could not be matched automatically."
                : record.reasonCodes?.includes(
                      "PARENT_FIRST_NAME_MISMATCH_OR_UNREADABLE",
                    )
                  ? "National ID recognized, but the given name could not be matched."
                  : record.reasonCodes?.includes(
                        "PARENT_LAST_NAME_MISMATCH_OR_UNREADABLE",
                      )
                    ? "National ID recognized, but the surname could not be matched."
                    : "Inspect the original document and confirm to continue.",
      expiresAt: new Date(record.expiresAt).toISOString(),
    };
  }

  public detectImage(buffer: Buffer): "image/jpeg" | "image/png" {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    )
      return "image/jpeg";
    if (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      return "image/png";
    throw new ValidationError("Only valid JPG and PNG images are allowed.");
  }

  private makePrompt(type: DocumentType) {
    return `Observe this enrollment image. Return one JSON object only with exactly this shape: {"documentVisible":boolean,"detectedType":"birth_certificate|government_id|other_document|person_photo|unrelated_image|unknown","readable":boolean,"cropped":boolean,"glare":boolean,"blurred":boolean,"rotated":boolean,"confidence":number,"extractedFields":{"childFullName":string|null,"dateOfBirth":string|null,"parentFullName":string|null,"parentFirstName":string|null,"parentMiddleName":string|null,"parentLastName":string|null},"reasonCodes":string[]}. Do not approve, reject, authenticate, or declare validity. Expected type: ${type === "birthCertificate" ? "birth_certificate" : "government_id"}. Philippine PhilID, ePhilID, Digital National ID, passports, driver licenses, and other government photo IDs must use detectedType government_id. Use other_document for a real document that is not a birth certificate or government photo ID. ${type === "birthCertificate" ? "Extract only childFullName and dateOfBirth; set all parent name fields null." : "Extract the ID holder's given/first name into parentFirstName, middle name into parentMiddleName when printed, and surname/last name into parentLastName. Also set parentFullName only if clearly printed as one field; set child fields null."} Never extract ID numbers, addresses, signatures, serial numbers, or barcode/QR contents.`;
  }

  public decideDocumentVerification(
    type: DocumentType,
    obs: GeminiDocumentObservations,
    expected: any,
  ) {
    const verifyThreshold = this.envNumber(
      "DOCUMENT_VERIFICATION_VERIFY_CONFIDENCE",
      0.85,
      0,
      1,
    );
    const rejectThreshold = Math.max(
      verifyThreshold,
      this.envNumber("DOCUMENT_VERIFICATION_REJECT_CONFIDENCE", 0.9, 0, 1),
    );
    const expectedType =
      type === "birthCertificate" ? "birth_certificate" : "government_id";
    let requiredFieldsMatch: boolean;
    let fieldMatches: Record<string, boolean>;
    let matchReasonCodes: string[] = [];
    if (type === "birthCertificate") {
      fieldMatches = {
        childName: this.fuzzyMatch(
          obs.extractedFields.childFullName,
          expected.childFullName,
        ),
        birthDate: obs.extractedFields.dateOfBirth === expected.dateOfBirth,
      };
      requiredFieldsMatch = Object.values(fieldMatches).every(Boolean);
      if (!requiredFieldsMatch)
        matchReasonCodes = ["FIELD_MISMATCH_OR_UNCERTAIN"];
    } else if (expected.parentFirstName && expected.parentLastName) {
      const firstNameMatch = this.componentMatch(
        obs.extractedFields.parentFirstName,
        obs.extractedFields.parentFullName,
        expected.parentFirstName,
      );
      const lastNameMatch = this.componentMatch(
        obs.extractedFields.parentLastName,
        obs.extractedFields.parentFullName,
        expected.parentLastName,
      );
      const middleNameObserved = Boolean(obs.extractedFields.parentMiddleName);
      const middleNameExpected = Boolean(expected.parentMiddleName);
      const middleNameMatch =
        middleNameObserved && middleNameExpected
          ? this.fuzzyMatch(
              obs.extractedFields.parentMiddleName,
              expected.parentMiddleName,
            )
          : false;
      requiredFieldsMatch = firstNameMatch && lastNameMatch;
      fieldMatches = {
        parentFirstName: firstNameMatch,
        parentMiddleName: middleNameMatch,
        parentLastName: lastNameMatch,
        parentName: requiredFieldsMatch,
      };
      if (!firstNameMatch)
        matchReasonCodes.push("PARENT_FIRST_NAME_MISMATCH_OR_UNREADABLE");
      if (!lastNameMatch)
        matchReasonCodes.push("PARENT_LAST_NAME_MISMATCH_OR_UNREADABLE");
      if (requiredFieldsMatch)
        matchReasonCodes.push("PARENT_NAME_COMPONENTS_MATCHED");
      if ((middleNameExpected || middleNameObserved) && !middleNameMatch)
        matchReasonCodes.push("PARENT_MIDDLE_NAME_UNCERTAIN");
    } else {
      const legacyMatch = this.fuzzyMatch(
        obs.extractedFields.parentFullName,
        expected.parentFullName,
      );
      fieldMatches = { parentName: legacyMatch };
      requiredFieldsMatch = legacyMatch;
      if (!legacyMatch) matchReasonCodes = ["FIELD_MISMATCH_OR_UNCERTAIN"];
    }
    const wrongType =
      ["birth_certificate", "government_id", "other_document"].includes(
        obs.detectedType,
      ) && obs.detectedType !== expectedType;
    const unrelated = ["person_photo", "unrelated_image"].includes(
      obs.detectedType,
    );
    const qualityReasonCodes = [
      ...(!obs.readable ? ["IMAGE_NOT_READABLE"] : []),
      ...(obs.cropped ? ["IMAGE_CROPPED"] : []),
      ...(obs.glare ? ["IMAGE_GLARE_DETECTED"] : []),
      ...(obs.blurred ? ["IMAGE_BLURRED"] : []),
      ...(obs.rotated ? ["IMAGE_ROTATED"] : []),
    ];
    // A readable government ID can still have minor quality observations while
    // its type and required name components remain clearly identifiable.
    const qualityAllowsVerification =
      type === "parentId"
        ? obs.readable
        : obs.readable && !obs.cropped && !obs.glare && !obs.blurred;
    let status: VerificationStatus = "teacher_confirmation_required";
    if (
      (!obs.documentVisible || wrongType || unrelated) &&
      obs.confidence >= rejectThreshold
    )
      status = "rejected";
    else if (
      obs.detectedType === expectedType &&
      obs.documentVisible &&
      qualityAllowsVerification &&
      obs.confidence >= verifyThreshold &&
      requiredFieldsMatch
    )
      status = "verified";
    const reasonCodes = [
      ...new Set([
        ...(obs.reasonCodes || []),
        ...qualityReasonCodes,
        ...matchReasonCodes,
      ]),
    ];
    return { status, fieldMatches, reasonCodes };
  }

  public async verifyEnrollmentDocument(
    user: any,
    bodyInput: unknown,
    file?: Express.Multer.File,
  ) {
    if (!user?.id || user.role !== "teacher")
      throw new ForbiddenError("Teachers only");
    const body = verifyDocumentBodySchema.parse(bodyInput);
    if (!file?.buffer?.length)
      throw new ValidationError("A non-empty image is required.");
    if (file.size > 5 * 1024 * 1024)
      throw new ValidationError("Image must be 5 MB or below.");
    const mimeType = this.detectImage(file.buffer);
    const fileHash = this.hash(file.buffer);
    const expected = this.canonicalExpected(body);
    const expectedFieldsHash = this.buildExpectedFieldsHash(body);
    let metadata: Metadata;
    try {
      metadata = await sharp(file.buffer, {
        animated: true,
        limitInputPixels: 40_000_000,
      }).metadata();
    } catch {
      throw new ValidationError("The image is corrupted or cannot be decoded.");
    }
    if (!metadata.width || !metadata.height || (metadata.pages || 1) !== 1)
      throw new ValidationError(
        "The image is malformed or contains multiple frames.",
      );
    if (
      Math.min(metadata.width, metadata.height) <
      this.envNumber("DOCUMENT_VERIFICATION_MIN_SHORT_EDGE", 480, 100, 4000)
    )
      throw new ValidationError("The image resolution is too small to read.");
    if (
      metadata.width * metadata.height >
      this.envNumber(
        "DOCUMENT_VERIFICATION_MAX_PIXELS",
        40_000_000,
        1_000_000,
        100_000_000,
      )
    )
      throw new ValidationError("The image resolution is too large.");
    const cacheKey = {
      teacherId: user.id,
      documentType: body.documentType,
      fileHash,
      expectedFieldsHash,
      policyVersion: this.policyVersion(),
    };
    const cached = await documentVerificationRepository.findReusable(cacheKey);
    if (cached) return this.toResponse(cached);
    let analysis: Buffer;
    try {
      analysis = await sharp(file.buffer)
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 88 })
        .toBuffer();
    } catch {
      throw new ValidationError("The image is corrupted or cannot be decoded.");
    }
    let values: any;
    try {
      const timeoutMs = this.envNumber(
        "DOCUMENT_VERIFICATION_TIMEOUT_MS",
        20_000,
        1_000,
        120_000,
      );
      const raw = await Promise.race([
        observeDocumentImage({
          prompt: this.makePrompt(body.documentType),
          image: analysis,
          mimeType: "image/jpeg",
          modelName: this.modelVersion(),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new AIServiceError({
                  message: "Document analysis timed out.",
                  status: 504,
                  code: "ai_timeout",
                }),
              ),
            timeoutMs,
          ),
        ),
      ]);
      const obs = this.parseGeminiDocumentObservations(raw);
      const decision = this.decideDocumentVerification(
        body.documentType,
        obs,
        expected,
      );
      values = {
        ...decision,
        detectedType: obs.detectedType,
        confidence: obs.confidence,
        isTransientFailure: false,
      };
    } catch (error) {
      const code =
        error instanceof AIServiceError ? error.code : "malformed_ai_response";
      values = {
        status: "teacher_confirmation_required",
        detectedType: "unknown" as DetectedType,
        confidence: null,
        reasonCodes: [
          code === "quota_exceeded"
            ? "AI_QUOTA_EXHAUSTED"
            : code === "ai_timeout"
              ? "AI_TIMEOUT"
              : code === "malformed_ai_response"
                ? "AI_MALFORMED_RESPONSE"
                : "AI_SERVICE_UNAVAILABLE",
        ],
        fieldMatches: {},
        isTransientFailure: true,
      };
    }
    const minutes = values.isTransientFailure
      ? this.envNumber("DOCUMENT_VERIFICATION_FAILURE_EXPIRY_MINUTES", 10, 1, 120)
      : this.envNumber("DOCUMENT_VERIFICATION_NORMAL_EXPIRY_MINUTES", 30, 1, 1440);
    const record = await documentVerificationRepository.create({
      ...cacheKey,
      ...values,
      teacherConfirmed: false,
      modelVersion: this.modelVersion(),
      expiresAt: new Date(Date.now() + minutes * 60_000),
    });
    return this.toResponse(record);
  }

  public async confirmEnrollmentDocument(
    user: any,
    verificationId: string,
  ) {
    if (!user?.id || user.role !== "teacher")
      throw new ForbiddenError("Teachers only");
    const record = await documentVerificationRepository.findOwned(
      verificationId,
      user.id,
    );
    if (!record) throw new NotFoundError("Document verification");
    if (
      record.status !== "teacher_confirmation_required" ||
      record.consumedAt ||
      record.expiresAt <= new Date()
    )
      throw new ValidationError("This verification cannot be confirmed.");
    record.teacherConfirmed = true;
    record.confirmedBy = user.id as any;
    record.confirmedAt = new Date();
    await record.save();
    return this.toResponse(record);
  }

  public async assertEnrollmentVerification(params: {
    id: string;
    teacherId: string;
    documentType: DocumentType;
    file: Express.Multer.File;
    expectedBody: any;
  }) {
    const record = await documentVerificationRepository.findEligible(
      params.id,
      params.teacherId,
    );
    if (!record)
      throw new ValidationError(
        "Document verification is expired, used, or unavailable.",
      );
    const eligible =
      record.status === "verified" ||
      (record.status === "teacher_confirmation_required" &&
        record.teacherConfirmed);
    if (
      !eligible ||
      record.documentType !== params.documentType ||
      record.fileHash !== this.hash(params.file.buffer) ||
      record.expectedFieldsHash !==
        this.buildExpectedFieldsHash(params.expectedBody) ||
      record.policyVersion !== this.policyVersion()
    )
      throw new ValidationError(
        "Document verification no longer matches the submitted enrollment.",
      );
    return record;
  }
}

export const documentVerificationService = new DocumentVerificationService();
