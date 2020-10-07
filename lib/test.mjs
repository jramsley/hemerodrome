import { Spec, Suite, States } from './index.mjs';

const s = new Suite();
console.log(s.state);
console.log(s.start);
console.log(s.id);
console.log(s.name);
s.name = 'el kabong';
console.log(s.name);
console.log(s.summary);
console.log(s);
s.add(new Spec('spec1234'));
console.log(s.items);
console.log((new Spec()) instanceof Spec);
console.log(s.summary);
s.add(new Spec('spec90193'));
console.log(s.summary);
s.add(new Spec('spec123010'));
s.end();
console.log(s.summary);
s.add('asd');
console.log(s.summary);
