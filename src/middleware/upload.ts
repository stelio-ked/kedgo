import multer from "multer";
import path from "path";
import fs from "fs";

// Garantir que o diretório de uploads exista na raiz do projeto
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento em disco local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Evitar caracteres especiais e garantir nome único
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// Tipos de arquivo aceitos no chat (imagens, vídeos, áudio e PDF/documentos comuns)
const allowedMimetypes = [
  // Imagens
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Áudios (incluindo gravações de voz)
  "audio/webm",
  "audio/ogg",
  "audio/mp3",
  "audio/wav",
  "audio/mpeg",
  // Vídeos
  "video/mp4",
  "video/webm",
  "video/ogg",
  // Documentos
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
];

export const chatUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado no chat."));
    }
  }
});
