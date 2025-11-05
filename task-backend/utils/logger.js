function redact(value) {
  if (!value) return value;
  let str = typeof value === "string" ? value : JSON.stringify(value);
  // Redact emails
  str = str.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]");
  // Redact phone-like numbers (7+ consecutive digits)
  str = str.replace(/\b\+?\d[\d\s\-()]{6,}\b/g, "[redacted-phone]");
  return str;
}

function info(...args) {
  if (process.env.NODE_ENV === "production") {
    console.log(...args.map(redact));
  } else {
    console.log(...args);
  }
}

function error(...args) {
  console.error(...args.map(redact));
}

module.exports = { info, error, redact };


