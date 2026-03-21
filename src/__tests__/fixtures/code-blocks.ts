/** Code block test fixtures for syntax highlighting tests. */

export const javascript = {
  simple: `const x = 1;`,
  function: `function add(a, b) {
  return a + b;
}`,
  arrowFunction: `const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};`,
  classDefinition: `class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return \`\${this.name} makes a sound.\`;
  }
}`,
  imports: `import { readFile } from 'fs';
import path from 'path';
export default function main() {}`,
  allTokenTypes: `// A comment
const PI = 3.14;
let greeting = "hello";
function add(a, b) {
  if (a === null || b === undefined) {
    return 0;
  }
  return a + b;
}
const result = add(1, 2);`,
};

export const typescript = {
  interface: `interface User {
  readonly id: number;
  name: string;
  email?: string;
}`,
  typeAlias: `type Result<T> = {
  data: T;
  error: string | null;
};`,
  enumDef: `enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}`,
  generic: `function identity<T>(arg: T): T {
  return arg;
}`,
  decorator: `@Component({
  selector: 'app-root',
})
class AppComponent implements OnInit {
  ngOnInit(): void {}
}`,
};

export const unknownLanguage = {
  brainfuck: `+++[-]>>>[-]<<<`,
  whitespace: `   \t \t\t\n`,
};

export const markdown = {
  fencedJS: '```javascript\nconst x = 1;\n```',
  fencedTS: '```typescript\ninterface Foo {}\n```',
  fencedUnknown: '```brainfuck\n+++[-]\n```',
  fencedNoLang: '```\nplain text\n```',
};
