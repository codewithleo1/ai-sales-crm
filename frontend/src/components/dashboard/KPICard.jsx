export default function KPICard({ title, value, subtitle, color = 'indigo' }) {
  const styles = {
    indigo: { wrapper: 'bg-indigo-50', text: 'text-indigo-900', sub: 'text-indigo-400', label: 'text-indigo-400' },
    green:  { wrapper: 'bg-emerald-50', text: 'text-emerald-900', sub: 'text-emerald-400', label: 'text-emerald-400' },
    red:    { wrapper: 'bg-red-50', text: 'text-red-900', sub: 'text-red-400', label: 'text-red-400' },
    yellow: { wrapper: 'bg-yellow-50', text: 'text-yellow-900', sub: 'text-yellow-400', label: 'text-yellow-400' },
  }

  const s = styles[color] || styles.indigo

  return (
    <div className={`${s.wrapper} rounded-xl p-5 transition-transform hover:-translate-y-0.5`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${s.label}`}>
        {title}
      </p>
      <p className={`text-2xl font-bold ${s.text}`}>{value}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${s.sub}`}>{subtitle}</p>
      )}
    </div>
  )
}