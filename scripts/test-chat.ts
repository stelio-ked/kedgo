import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "meu-secret-super-seguro-dev-only";
const token = jwt.sign({ id: 1, email: "drfabricioferreiraof@gmail.com", name: "Fabricio" }, JWT_SECRET, { expiresIn: '7d' });

fetch('http://localhost:3000/api/messages/1?username=Fabricio', {
  headers: { "Authorization": `Bearer ${token}` }
}).then(res => res.text()).then(console.log).catch(console.error);
