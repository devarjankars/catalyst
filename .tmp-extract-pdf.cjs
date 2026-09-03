const { PDFDocument, PDFName } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SAMPLE = "C:/Users/darshan.t/Downloads/MAT-US-ELA-01541_SFMC-email_Dr. Hussein_EMERALD-Trial-and-RWE-VSB-Combined (5).pdf";
const OUT = "d:/2026/email/email_builder/email_builder_latest/catalyst/.pdftmp";

function val(obj, name) {
  try { const d = obj.dict || obj; return d.get(PDFName.of(name)); } catch (e) { return null; }
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const doc = await PDFDocument.load(fs.readFileSync(SAMPLE), { ignoreEncryption: true, throwOnInvalidObject: false });
  console.log("pages:" + doc.getPageCount());
  for (let i =  0; i < doc.getPageCount(); i +=  1) {
    const page = doc.getPage(i);
    console.log("p" + (i +  1) + " w:" + page.getWidth() + " h:" + page.getHeight());
    const res = page.node.Resources();
    const xo = res ? val(res, "XObject") : null;
    if (!xo) { console.log("  no xo"); continue; }
    for (const ent of (xo.entries() || [])) {
      const ref = ent[1];
      let obj;
      try { obj = doc.context.lookup(ref); } catch (e) { continue; }
      const sub = val(obj, "Subtype"); console.log("    xo " + ent[0].toString() + " type " + (obj ? obj.constructor.name : "?") + " sub " + (sub ? sub.toString() : "none"));
      if (!sub || sub.toString().indexOf("Image") < 0) continue;
      const filter = val(obj, "Filter");
      const dt = val(obj, "Width");
      const ht = val(obj, "Height");
      let bytes = obj.contents;
      if (!bytes) continue;
      let f = filter ? filter.toString() : "";
      let ext = "bin";
      let out = Buffer.from(bytes);
      if (f.indexOf("FlateDecode") >= 0) { try { out = zlib.inflateSync(out); ext = "png"; } catch (e) { console.log("inflate fail"); } }
      else if (f.indexOf("DCTDecode") >= 0) { ext = "jpg"; }
      const nm = "p" + (i +  1) + "_" + ent[0].toString().replace(/[^a-zA-Z0-9]/g, "_") + "." + ext;
      fs.writeFileSync(path.join(OUT, nm), out);
      console.log("  saved " + nm + " w:" + (dt ? dt.number : 0) + " h:" + (ht ? ht.number : 0));
    }
  }
}
run().catch(e => console.log("ERR " + e.message));