import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      if (title) {
        await db.update(itineraries).set({ title, updatedAt: new Date() }).where(eq(itineraries.id, itineraryId));
      }

      if (data) {
        await db.delete(travelers).where(eq(travelers.itineraryId, itineraryId));`;

if (!content.includes(targetStr)) {
  console.log("Could not find target block to replace.");
  process.exit(1);
}

// Just wrapping in transaction is more robust.
const replacementStr = `      await db.transaction(async (tx) => {
        if (title) {
          await tx.update(itineraries).set({ title, updatedAt: new Date() }).where(eq(itineraries.id, itineraryId));
        }

        if (data) {
          await tx.delete(travelers).where(eq(travelers.itineraryId, itineraryId));`;

// But wait, there are hundreds of 'await db.' inside the block that need to be 'await tx.'
// Let's do a substring replace
const startIndex = content.indexOf(`      if (title) {
        await db.update(itineraries).set({ title, updatedAt: new Date() }).where(eq(itineraries.id, itineraryId));`);

const endIndex = content.indexOf(`      res.json({ success: true, message: "Itinerário atualizado com sucesso" });`);

if (startIndex === -1 || endIndex === -1) {
  console.log("Indices not found.");
  process.exit(1);
}

let before = content.substring(0, startIndex);
let block = content.substring(startIndex, endIndex);
let after = content.substring(endIndex);

block = block.replace(/await db\./g, 'await tx.');
block = `      await db.transaction(async (tx) => {\n  ${block}      });\n\n`;

fs.writeFileSync('server.ts', before + block + after);
console.log("Done");
