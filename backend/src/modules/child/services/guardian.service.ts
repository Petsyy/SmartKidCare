import Child from "../../../models/Child";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { storageService } from "../../../shared/services/storage.service";
import { generateSecureUrl } from "../../../shared/utils/generate-secure-url";

const attachGuardianUploads = async (
  guardianData: any,
  files?: Record<string, Express.Multer.File[] | undefined>,
) => {
  const nextGuardianData = { ...guardianData };

  if (files?.guardianPhoto?.[0]) {
    const file = files.guardianPhoto[0];
    const upload = await storageService.uploadFile(
      file.buffer,
      "child-guardians/photos",
      file.mimetype,
      file.originalname,
    );

    nextGuardianData.photoUrl = generateSecureUrl(
      upload.publicId,
      upload.resourceType,
      upload.format,
    );
    nextGuardianData.photoPublicId = upload.publicId;
  }

  if (files?.guardianId?.[0]) {
    const file = files.guardianId[0];
    const upload = await storageService.uploadFile(
      file.buffer,
      "child-guardians/ids",
      file.mimetype,
      file.originalname,
    );

    nextGuardianData.idUrl = generateSecureUrl(
      upload.publicId,
      upload.resourceType,
      upload.format,
    );
    nextGuardianData.idPublicId = upload.publicId;
  }

  return nextGuardianData;
};

class GuardianService {
  public async addGuardian(
    user: any,
    childId: string,
    guardianData: any,
    files?: Record<string, Express.Multer.File[] | undefined>,
  ) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent") {
      throw new ForbiddenError(
        "Parents are not authorized to add guardians directly",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if ((child.authorizedPickupPersons?.length || 0) >= 5) {
      throw new ValidationError("Maximum of 5 guardians allowed");
    }

    child.authorizedPickupPersons = child.authorizedPickupPersons || [];
    const normalizedGuardian = await attachGuardianUploads(guardianData, files);
    child.authorizedPickupPersons.push(normalizedGuardian);
    await child.save();

    return child.authorizedPickupPersons;
  }

  public async updateGuardian(
    user: any,
    childId: string,
    guardianIndex: number,
    guardianData: any,
    files?: Record<string, Express.Multer.File[] | undefined>,
  ) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent") {
      throw new ForbiddenError(
        "Parents are not authorized to modify guardians directly",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      !child.authorizedPickupPersons ||
      !child.authorizedPickupPersons[guardianIndex]
    ) {
      throw new NotFoundError("Guardian");
    }

    const normalizedGuardian = await attachGuardianUploads(guardianData, files);
    child.authorizedPickupPersons[guardianIndex] = {
      ...child.authorizedPickupPersons[guardianIndex],
      ...normalizedGuardian,
    };
    await child.save();

    return child.authorizedPickupPersons;
  }

  public async removeGuardian(
    user: any,
    childId: string,
    guardianIndex: number,
  ) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent") {
      throw new ForbiddenError(
        "Parents are not authorized to remove guardians directly",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to manage guardians for this child",
      );
    }

    if (
      !child.authorizedPickupPersons ||
      !child.authorizedPickupPersons[guardianIndex]
    ) {
      throw new NotFoundError("Guardian");
    }

    child.authorizedPickupPersons[guardianIndex].isActive = false;
    await child.save();
  }

  public async getGuardians(user: any, childId: string) {
    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child");

    if (user.role === "parent" && String(child.parent) !== String(user.id)) {
      throw new ForbiddenError(
        "Not authorized to view guardians for this child",
      );
    }

    if (
      user.role === "teacher" &&
      String(child.daycareCenter) !== String(user.daycareCenterId)
    ) {
      throw new ForbiddenError(
        "Not authorized to view guardians for this child",
      );
    }

    return child.authorizedPickupPersons || [];
  }
}

export const guardianService = new GuardianService();

