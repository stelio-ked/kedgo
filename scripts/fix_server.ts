import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace (x.id || '') + '-' + Math.random().toString(36).substring(7)
// with just x.id || 'id-' + Math.random().toString(36).substring(7)
// This will prevent the `-` appending continuously.

content = content.replace(/\(t\.id \|\| ''\) \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\)/g, "t.id || 't-' + Math.random().toString(36).substring(7)");
content = content.replace(/\(d\.id \|\| ''\) \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\)/g, "d.id || 'd-' + Math.random().toString(36).substring(7)");
content = content.replace(/\(day\.id \|\| ''\) \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\)/g, "day.id || 'day-' + Math.random().toString(36).substring(7)");
content = content.replace(/\(act\.id \|\| ''\) \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\)/g, "act.id || 'act-' + Math.random().toString(36).substring(7)");
content = content.replace(/\(c\.id \|\| ''\) \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\)/g, "c.id || 'c-' + Math.random().toString(36).substring(7)");
content = content.replace(/\(doc\.id \|\| ''\) \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\)/g, "doc.id || 'doc-' + Math.random().toString(36).substring(7)");
content = content.replace(/\(f\.id \|\| ''\) \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\)/g, "f.id || 'f-' + Math.random().toString(36).substring(7)");
content = content.replace(/\(tip\.id \|\| ''\) \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\)/g, "tip.id || 'tip-' + Math.random().toString(36).substring(7)");
// also n.id
content = content.replace(/n\.id \? n\.id \+ '-' \+ Math\.random\(\)\.toString\(36\)\.substring\(7\) : Math\.random\(\)\.toString\(\)/g, "n.id || 'notif-' + Math.random().toString(36).substring(7)");

fs.writeFileSync('server.ts', content);
