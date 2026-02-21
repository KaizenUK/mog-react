export function ProductEditorHintsInput(props: any) {
  const text = props?.schemaType?.description || 'Editor note'

  return (
    <div style={{border: '1px solid #e5e7eb', borderRadius: 6, padding: 12}}>
      <div style={{fontWeight: 600, fontSize: 12, marginBottom: 6}}>Editor Note</div>
      <div style={{fontSize: 12, opacity: 0.8}}>{text}</div>
    </div>
  )
}
