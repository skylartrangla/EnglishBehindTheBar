export default function TranslatableText({ text, className = "" }) {
  return <span className={`translatable-text ${className}`}>{text}</span>;
}
