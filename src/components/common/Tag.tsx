export function Tag(props: {
  label: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
}) {
  const tone = props.tone ?? 'neutral'
  return <span className={`tag tag-${tone}`}>{props.label}</span>
}

