// Server-side validation for the contact form (the browser also checks, but never trust the browser).
const oneLine = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const multiLine = (s, max) =>
  String(s ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;

export function validateContact(body = {}) {
  const values = {
    name: oneLine(body.name, 80),
    email: oneLine(body.email, 254),
    subject: oneLine(body.subject, 120),
    message: multiLine(body.message, 2000),
  };
  const errors = {};
  if (values.name.length < 2) errors.name = 'Please enter your name (at least 2 characters).';
  if (!EMAIL.test(values.email)) errors.email = 'Please enter a valid email address.';
  if (values.subject.length < 3) errors.subject = 'Please add a short subject (at least 3 characters).';
  if (values.message.length < 10) errors.message = 'Your message is a bit short (at least 10 characters).';
  else if ((values.message.match(/https?:\/\//gi) || []).length > 3) errors.message = 'Please include at most 3 links.';
  return { ok: Object.keys(errors).length === 0, errors, values };
}
