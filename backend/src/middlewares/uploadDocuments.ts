import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Only PDF, JPG, PNG allowed"));
    } else {
      cb(null, true);
    }
  },
});

export default upload;