export default function Logo() {
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontWeight: 600,
        fontSize: "1.35rem",
        letterSpacing: "-0.01em",
        background: "linear-gradient(135deg, oklch(0.60 0.10 185) 0%, oklch(0.38 0.12 158) 50%, oklch(0.22 0.09 148) 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      Paradies
    </span>
  )
}
