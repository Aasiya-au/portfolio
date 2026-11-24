import assert from 'node:assert/strict';
import { validateContact } from './validate.js';

const good = { name: 'Sara', email: 'sara@example.com', subject: 'Hello there', message: 'I loved your portfolio, great work!' };
assert.equal(validateContact(good).ok, true);
assert.ok(validateContact({ ...good, name: '' }).errors.name);
assert.ok(validateContact({ ...good, email: 'not-an-email' }).errors.email);
assert.ok(validateContact({ ...good, email: 'a@b@c.com' }).errors.email);
assert.ok(validateContact({ ...good, subject: 'hi' }).errors.subject);
assert.ok(validateContact({ ...good, message: 'short' }).errors.message);
assert.ok(validateContact({ ...good, message: 'x https://a.com https://b.com https://c.com https://d.com yy' }).errors.message);
// header-injection attempt: newlines in single-line fields are flattened
const inj = validateContact({ ...good, subject: 'Hi\r\nBcc: evil@x.com' });
assert.ok(!/[\r\n]/.test(inj.values.subject));
// length caps
assert.equal(validateContact({ ...good, message: 'a'.repeat(5000) }).values.message.length, 2000);
console.log('validate.js: all checks passed');
