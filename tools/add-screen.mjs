/**
 * add-screen.mjs — bakes an "iva-screen" surface into the iva GLB models.
 *
 * The exported models have no UV coordinates anywhere, so nothing in them can
 * carry a texture. This tool finds the recessed rounded-rect pocket on the front
 * door (mesh "taban"), copies that patch into a new primitive that sits a hair
 * in front of it, gives it UVs + its own black material, and appends the result
 * to the GLB. index.html then paints an animated face onto that material with
 * model-viewer's canvas-texture API.
 *
 *   node tools/add-screen.mjs
 *
 * Reads models/src/*.glb (pristine exports) and writes models/*.glb (served).
 * Re-run it whenever the models are re-exported.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const require = createRequire(import.meta.url);

const DOOR_MESH   = 'taban';   // front door: the pocket lives on this mesh
const MAT_NAME    = 'iva-screen';
const LIFT_M      = 0.0008;    // push the screen this far out of the pocket (m)
const INSET_M     = 0.0012;    // shrink the patch so a hairline of bezel shows
const GLB_MAGIC   = 0x46546C67;
const CHUNK_JSON  = 0x4E4F534A;
const CHUNK_BIN   = 0x004E4942;

/* ────────────────────────── GLB container ────────────────────────── */

function readGLB(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== GLB_MAGIC) throw new Error(`${file}: not a GLB`);
  const total = buf.readUInt32LE(8);
  let off = 12, json = null, bin = null;
  while (off < total) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const chunk = buf.subarray(off + 8, off + 8 + len);
    if (type === CHUNK_JSON) json = JSON.parse(chunk.toString('utf8'));
    else if (type === CHUNK_BIN) bin = Buffer.from(chunk);
    off += 8 + len;
  }
  if (!json || !bin) throw new Error(`${file}: missing JSON or BIN chunk`);
  return { json, bin };
}

function writeGLB(file, json, bin) {
  const pad = (b, fill) => {
    const rem = b.length % 4;
    return rem === 0 ? b : Buffer.concat([b, Buffer.alloc(4 - rem, fill)]);
  };
  const jsonChunk = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const binChunk = pad(bin, 0);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(GLB_MAGIC, 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  const ch = (len, type) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4);
    return h;
  };
  fs.writeFileSync(file, Buffer.concat([
    head, ch(jsonChunk.length, CHUNK_JSON), jsonChunk,
    ch(binChunk.length, CHUNK_BIN), binChunk,
  ]));
}

/* ────────────────────────── Draco ────────────────────────── */

let dracoPromise = null;
function draco() {
  if (!dracoPromise) {
    const mod = require(path.join(ROOT, 'vendor/draco/draco_decoder.js'));
    dracoPromise = mod();
  }
  return dracoPromise;
}

async function decodePrimitive(json, bin, prim) {
  const ext = prim.extensions?.KHR_draco_mesh_compression;
  if (!ext) throw new Error('expected a Draco-compressed primitive');
  const d = await draco();
  const bv = json.bufferViews[ext.bufferView];
  const data = bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);

  const decoder = new d.Decoder();
  const dbuf = new d.DecoderBuffer();
  dbuf.Init(new Int8Array(data), data.length);
  const mesh = new d.Mesh();
  const status = decoder.DecodeBufferToMesh(dbuf, mesh);
  if (!status.ok()) throw new Error('Draco decode failed: ' + status.error_msg());

  const attr = decoder.GetAttributeByUniqueId(mesh, ext.attributes.POSITION);
  const nv = mesh.num_points();
  const fa = new d.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(mesh, attr, fa);
  const pos = new Float64Array(nv * 3);
  for (let i = 0; i < nv * 3; i++) pos[i] = fa.GetValue(i);

  const nf = mesh.num_faces();
  const idx = new Uint32Array(nf * 3);
  const ia = new d.DracoInt32Array();
  for (let f = 0; f < nf; f++) {
    decoder.GetFaceFromMesh(mesh, f, ia);
    idx[f * 3] = ia.GetValue(0); idx[f * 3 + 1] = ia.GetValue(1); idx[f * 3 + 2] = ia.GetValue(2);
  }
  d.destroy(fa); d.destroy(ia); d.destroy(mesh); d.destroy(dbuf); d.destroy(decoder);
  return { pos, idx, nv, nf };
}

/* ────────────────────────── vector helpers ────────────────────────── */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const at = (p, i) => [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];

/** rotate a vector by the inverse of a glTF quaternion [x,y,z,w] */
function rotateInverse(q, v) {
  const [x, y, z, w] = q;
  // conjugate rotation: v' = q* · v · q
  const t = cross([-x, -y, -z], v).map(c => 2 * c);
  const uv = cross([-x, -y, -z], t);
  return [v[0] + w * t[0] + uv[0], v[1] + w * t[1] + uv[1], v[2] + w * t[2] + uv[2]];
}

/* ────────────────────────── pocket detection ────────────────────────── */

/**
 * The screen pocket floor is the single largest coplanar patch on the door, by a
 * factor of three over anything else. Grow a plane out of the biggest triangle
 * and collect everything coplanar with it.
 */
function findPocket({ pos, idx, nf }, scale) {
  const tri = [];
  for (let f = 0; f < nf; f++) {
    const a = at(pos, idx[f * 3]), b = at(pos, idx[f * 3 + 1]), c = at(pos, idx[f * 3 + 2]);
    const n = cross(sub(b, a), sub(c, a));
    const l = len(n);
    if (l < 1e-9) continue;
    const nrm = [n[0] / l, n[1] / l, n[2] / l];
    tri.push({ f, area: l / 2, n: nrm, c: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3] });
  }
  const tol = 0.0008 / scale;                       // 0.8 mm, in model units
  // Offsets are always measured along one reference normal: a sliver triangle's
  // own normal can be half a degree off, which over a 200 mm patch throws its
  // apparent plane offset out by more than the tolerance.
  const collect = (n, d) => tri.filter(t => dot(t.n, n) > 0.999 && Math.abs(dot(n, t.c) - d) < tol);
  const claimed = new Set();
  let best = null;
  for (const seed of [...tri].sort((p, q) => q.area - p.area).slice(0, 40)) {
    if (claimed.has(seed.f)) continue;
    let faces = collect(seed.n, dot(seed.n, seed.c));
    // refit the plane on the whole patch, then take a second pass: the seed's own
    // normal is only as good as one triangle.
    let area = faces.reduce((s, t) => s + t.area, 0);
    const wn = faces.reduce((s, t) => [s[0] + t.n[0] * t.area, s[1] + t.n[1] * t.area, s[2] + t.n[2] * t.area], [0, 0, 0]);
    const n = norm(wn);
    const d = faces.reduce((s, t) => s + dot(n, t.c) * t.area, 0) / area;
    faces = collect(n, d);
    area = faces.reduce((s, t) => s + t.area, 0);
    faces.forEach(t => claimed.add(t.f));
    if (!best || area > best.area) best = { area, faces: faces.map(t => t.f), n, d };
  }
  if (!best) throw new Error('no planar patch found on the door mesh');
  return best;
}

/* ────────────────────────── build the screen primitive ────────────────────────── */

function buildScreen(geo, pocket, node, scale) {
  // in-plane basis: u along world +X, v along world +Y, both projected into the
  // pocket plane, so the texture lands upright however the door is oriented.
  const q = node.rotation || [0, 0, 0, 1];
  const localX = rotateInverse(q, [1, 0, 0]);
  const localY = rotateInverse(q, [0, 1, 0]);
  const N = pocket.n;
  let u = norm(sub(localX, N.map(c => c * dot(localX, N))));
  let v = norm(sub(localY, N.map(c => c * dot(localY, N))));
  if (dot(cross(u, v), N) < 0) v = v.map(c => -c);

  // gather the patch, keeping the original triangulation
  const remap = new Map();
  const verts = [];
  const tris = [];
  for (const f of pocket.faces) {
    const t = [];
    for (let k = 0; k < 3; k++) {
      const vi = geo.idx[f * 3 + k];
      if (!remap.has(vi)) { remap.set(vi, verts.length); verts.push(at(geo.pos, vi)); }
      t.push(remap.get(vi));
    }
    tris.push(t);
  }

  // flatten onto the plane, then shrink slightly toward the centre so a hairline
  // of the bezel stays visible around the screen
  const st = verts.map(p => [dot(p, u), dot(p, v)]);
  const bb = st.reduce((b, [s, t]) => [Math.min(b[0], s), Math.max(b[1], s), Math.min(b[2], t), Math.max(b[3], t)],
                       [Infinity, -Infinity, Infinity, -Infinity]);
  const cs = (bb[0] + bb[1]) / 2, ct = (bb[2] + bb[3]) / 2;
  const inset = INSET_M / scale;
  const ks = Math.max(0, 1 - inset / ((bb[1] - bb[0]) / 2));
  const kt = Math.max(0, 1 - inset / ((bb[3] - bb[2]) / 2));

  const lift = LIFT_M / scale;
  const out = { pos: [], nrm: [], uv: [] };
  const s0 = cs - (bb[1] - bb[0]) / 2 * ks, s1 = cs + (bb[1] - bb[0]) / 2 * ks;
  const t0 = ct - (bb[3] - bb[2]) / 2 * kt, t1 = ct + (bb[3] - bb[2]) / 2 * kt;
  for (const [s, t] of st) {
    const ss = cs + (s - cs) * ks, tt = ct + (t - ct) * kt;
    for (let k = 0; k < 3; k++) out.pos.push(u[k] * ss + v[k] * tt + N[k] * (pocket.d + lift));
    out.nrm.push(N[0], N[1], N[2]);
    out.uv.push((ss - s0) / (s1 - s0), 1 - (tt - t0) / (t1 - t0));   // glTF v points down
  }
  out.idx = tris.flat();
  out.size = [(s1 - s0) * scale, (t1 - t0) * scale];
  return out;
}

/* ────────────────────────── glTF surgery ────────────────────────── */

function appendScreen(json, bin, screen) {
  const chunks = [bin];
  let offset = bin.length;
  const addView = (buf) => {
    const padStart = (4 - (offset % 4)) % 4;
    if (padStart) { chunks.push(Buffer.alloc(padStart)); offset += padStart; }
    chunks.push(buf);
    const view = { buffer: 0, byteOffset: offset, byteLength: buf.length };
    offset += buf.length;
    json.bufferViews.push(view);
    return json.bufferViews.length - 1;
  };
  const f32 = a => Buffer.from(new Float32Array(a).buffer);
  const u16 = a => Buffer.from(new Uint16Array(a).buffer);

  const count = screen.uv.length / 2;
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) for (let k = 0; k < 3; k++) {
    mn[k] = Math.min(mn[k], screen.pos[i * 3 + k]);
    mx[k] = Math.max(mx[k], screen.pos[i * 3 + k]);
  }

  const acc = (o) => { json.accessors.push(o); return json.accessors.length - 1; };
  const aPos = acc({ bufferView: addView(f32(screen.pos)), componentType: 5126, count, type: 'VEC3', min: mn, max: mx });
  const aNrm = acc({ bufferView: addView(f32(screen.nrm)), componentType: 5126, count, type: 'VEC3' });
  const aUv  = acc({ bufferView: addView(f32(screen.uv)),  componentType: 5126, count, type: 'VEC2' });
  const aIdx = acc({ bufferView: addView(u16(screen.idx)), componentType: 5123, count: screen.idx.length, type: 'SCALAR' });

  json.materials.push({
    name: MAT_NAME,
    pbrMetallicRoughness: { baseColorFactor: [0, 0, 0, 1], metallicFactor: 0, roughnessFactor: 0.22 },
    emissiveFactor: [1, 1, 1],
    doubleSided: false,
  });
  const material = json.materials.length - 1;

  json.meshes.push({
    name: MAT_NAME,
    primitives: [{ attributes: { POSITION: aPos, NORMAL: aNrm, TEXCOORD_0: aUv }, indices: aIdx, mode: 4, material }],
  });
  const mesh = json.meshes.length - 1;

  json.nodes.push({ name: MAT_NAME, mesh, ...screen.trs });
  const node = json.nodes.length - 1;
  (json.scenes[json.scene ?? 0].nodes ||= []).push(node);

  const out = Buffer.concat(chunks);
  json.buffers[0].byteLength = out.length;
  return out;
}

/* ────────────────────────── main ────────────────────────── */

async function patch(srcFile, dstFile) {
  const { json, bin } = readGLB(srcFile);
  if (json.materials.some(m => m.name === MAT_NAME)) {
    throw new Error(`${srcFile} already contains a "${MAT_NAME}" material — patch the pristine export instead`);
  }

  const meshIndex = json.meshes.findIndex(m => m.name === DOOR_MESH);
  if (meshIndex < 0) throw new Error(`${srcFile}: no mesh named "${DOOR_MESH}"`);
  const node = json.nodes.find(n => n.mesh === meshIndex);
  if (!node) throw new Error(`${srcFile}: mesh "${DOOR_MESH}" is not referenced by any node`);
  const scale = (node.scale || [1, 1, 1])[0];

  const geo = await decodePrimitive(json, bin, json.meshes[meshIndex].primitives[0]);
  const pocket = findPocket(geo, scale);
  const screen = buildScreen(geo, pocket, node, scale);
  screen.trs = {
    ...(node.translation ? { translation: node.translation } : {}),
    ...(node.rotation ? { rotation: node.rotation } : {}),
    ...(node.scale ? { scale: node.scale } : {}),
  };

  const bin2 = appendScreen(json, bin, screen);
  writeGLB(dstFile, json, bin2);

  const [w, h] = screen.size;
  console.log(`${path.basename(dstFile)}: screen ${(w * 1000).toFixed(1)}×${(h * 1000).toFixed(1)} mm ` +
              `(aspect ${(w / h).toFixed(3)}), ${screen.idx.length / 3} tris, ` +
              `patch area ${(pocket.area * scale * scale * 1e4).toFixed(1)} cm²`);
}

const jobs = [['v2-closed.glb', 'v2-closed.glb'], ['v2-open.glb', 'v2-open.glb']];
for (const [src, dst] of jobs) {
  await patch(path.join(ROOT, 'models/src', src), path.join(ROOT, 'models', dst));
}
