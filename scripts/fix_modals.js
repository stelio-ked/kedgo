import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/components/OverviewTab.tsx',
  'src/components/CostsTab.tsx',
  'src/components/ItineraryTab.tsx',
  'src/components/Header.tsx',
  'src/components/DocumentsTab.tsx',
  'src/components/TravelersTab.tsx',
  'src/components/AdminDashboard.tsx'
];

for (const relPath of files) {
  const file = path.join(__dirname, relPath);
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // We need to replace the outermost div inside AnimatePresence with motion.div
  // Since all Modals follow a strict pattern:
  // {condition && (
  //   <div className="fixed inset-0...
  //     <motion.div...
  //       ...
  //     </motion.div>
  //   </div>
  // )}
  // We can just find `<div className="fixed inset-0` or `<div className="fixed inset-0 bg-black/40` etc.
  // And replace it.
  
  let regex = /({\s*[a-zA-Z0-9_]+\s*&&\s*\(\s*)<div (className="fixed inset-0[^"]*"(?: onClick={[^{}]+})?[^>]*)>/g;
  let hasChanges = false;
  
  content = content.replace(regex, (match, condition, rest) => {
    hasChanges = true;
    return condition + `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ${rest}>`;
  });
  
  if (hasChanges) {
    // Now we need to fix the closing tags.
    // This is a bit tricky, but since we know it ends with:
    //     </motion.div>
    //   </div>
    // )}
    // We can replace that specific sequence.
    content = content.replace(/<\/motion\.div>\s*<\/div>\s*\)\}\s*<\/AnimatePresence>/g, 
      '</motion.div>\n          </motion.div>\n        )}\n      </AnimatePresence>');
    
    // Some might have different indentation or comments. Let's just do a naive replace:
    content = content.replace(/<\/div>\s*\)\}\s*<\/AnimatePresence>/g, '</motion.div>\n        )}\n      </AnimatePresence>');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
