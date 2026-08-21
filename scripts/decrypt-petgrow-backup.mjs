import fs from "node:fs/promises";
import crypto from "node:crypto";
import zlib from "node:zlib";

const [source,output="petgrow-backup-restored.json"] = process.argv.slice(2);
const secret=String(process.env.BACKUP_ENCRYPTION_KEY||"");
if(!source){console.error("Usage: BACKUP_ENCRYPTION_KEY=... node scripts/decrypt-petgrow-backup.mjs <backup-url-or-file> [output.json]");process.exit(1);}
if(secret.length<16){console.error("BACKUP_ENCRYPTION_KEY is required.");process.exit(1);}

const raw=/^https?:\/\//i.test(source)
  ? Buffer.from(await (await fetch(source)).arrayBuffer())
  : await fs.readFile(source);
const envelope=JSON.parse(raw.toString("utf8"));
if(envelope?.v!==1||envelope?.alg!=="AES-256-GCM+GZIP")throw new Error("Unsupported PetGrow backup format");
const key=crypto.createHash("sha256").update(secret).digest();
const decipher=crypto.createDecipheriv("aes-256-gcm",key,Buffer.from(envelope.iv,"base64"));
decipher.setAuthTag(Buffer.from(envelope.tag,"base64"));
const compressed=Buffer.concat([decipher.update(Buffer.from(envelope.data,"base64")),decipher.final()]);
const plain=zlib.gunzipSync(compressed);
const parsed=JSON.parse(plain.toString("utf8"));
if(parsed?.service!=="PetGrow"||!parsed?.tables)throw new Error("Decrypted file is not a valid PetGrow central backup");
await fs.writeFile(output,JSON.stringify(parsed,null,2),"utf8");
console.log(`PetGrow backup restored to ${output}`);
console.log(`Backup created at: ${parsed.createdAt}`);
console.log(`Tables: ${Object.keys(parsed.tables).length}`);
