import fs from 'fs';
import path from 'path';

export function loadData() {
  const file = path.join(process.cwd(), 'public/data.json');
  const buffer = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(buffer);
  return data;
}
