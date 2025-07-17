const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configura a AWS apenas se as variáveis de ambiente existirem
if (process.env.AWS_ACCESS_KEY_ID) {
  aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION
  });
}

const s3 = new aws.S3();

const storage = process.env.AWS_BUCKET_NAME
  ? multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET_NAME,
      acl: 'public-read', // Permite que os ficheiros sejam vistos publicamente
      key: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = `task-file-${Date.now()}${ext}`;
        cb(null, uniqueName);
      }
    })
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
      }
    });

const upload = multer({ storage: storage });

module.exports = upload;