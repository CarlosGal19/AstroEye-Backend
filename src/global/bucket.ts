import { Storage } from "@google-cloud/storage";
import path from "path";

const storage = new Storage({
    keyFilename: path.join(process.cwd(), "gcp-key.json"),
});

const bucketName = "bucket_astro_eye";

const bucket = storage.bucket(bucketName);

export {
    storage,
    bucket,
    bucketName,
}
