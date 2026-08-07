import type { Request, Response } from "express";
import axios from "axios";
import {
  createChildDocumentAccessToken,
  getChildDocumentStreamByToken,
  getChildDocumentUrlByToken,
} from "../services/documents.service";

export const getChildDocumentSignedUrl = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await createChildDocumentAccessToken(
      req.user,
      String(req.params.id || ""),
      String(req.params.documentType || ""),
    );
    return res.status(result.status).json(result.body);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to generate document token",
      error: error?.message,
    });
  }
};

export const getChildDocumentUrl = async (req: Request, res: Response) => {
  try {
    const result = await getChildDocumentUrlByToken(String(req.params.token || ""));
    return res.status(result.status).json(result.body);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to retrieve document URL",
      error: error?.message,
    });
  }
};

const streamDocumentResponse = async (
  res: Response,
  tokenInput: string,
  errorMessage: string,
) => {
  const result = await getChildDocumentStreamByToken(tokenInput);
  if (result.status !== 200) {
    return res.status(result.status).json(result.body);
  }

  const payload = result.body as {
    signedUrl: string;
    contentType: string;
    fileName: string;
  };

  res.setHeader("Content-Type", payload.contentType);
  res.setHeader("Content-Disposition", `inline; filename="${payload.fileName}"`);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    const response = await axios.get(payload.signedUrl, {
      responseType: "stream",
      timeout: 30000,
    });
    response.data.pipe(res);
    return;
  } catch (error: any) {
    return res.status(502).json({
      message: "Failed to retrieve document from storage",
      error: error?.message,
    });
  }

  return res.status(500).json({ message: errorMessage });
};

export const streamChildDocument = async (req: Request, res: Response) => {
  try {
    return await streamDocumentResponse(
      res,
      String(req.params.token || ""),
      "Failed to stream document",
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to stream document",
      error: error?.message,
    });
  }
};

export const viewDocument = async (req: Request, res: Response) => {
  try {
    return await streamDocumentResponse(
      res,
      String(req.query.token || ""),
      "Failed to view document",
    );
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to view document",
      error: error?.message,
    });
  }
};
