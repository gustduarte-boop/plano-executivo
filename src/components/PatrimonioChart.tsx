import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const COLORS = {
  ibkr: '#185FA5',
  cdi: '#E24B4A',
  lci: '#F28B82',
  im1: '#BA7517',
  im2: '#EF9F27',
  cripto: '#7F77DD',
  savings: '#1D9E75',
  pension: '#9FE1CB',
}

interface DataPoint {
  mes: string
  ibkr: number
  cdi: number
  lci: number
  im1: number
  im2: number
  cripto: number
  savings: number
  pension: number
}

// Dados mock baseados no cenário base Master — serão substituídos por dados do Supabase
function gerarDadosMock(): DataPoint[] {
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const data: DataPoint[] = []

  for (let m = 0; m < 84; m += 3) {
    const ano = 2026 + Math.floor(m / 12)
    const mes = months[m % 12]
    const t = m / 83

    // Crescimento simplificado baseado nos scripts
    const ibkr = 61 + t * 900
    const savings = m < 38 ? 274 + t * 200 : 0
    const pension = m < 38 ? 114 + t * 80 : 0
    const cdi = 113 + (m < 38 ? t * 120 : 200)
    const lci = m > 12 ? (t - 0.14) * 600 : 0
    const im1 = 136 + t * 350
    const im2 = 523 + (m >= 21 ? (t - 0.25) * 1200 : 0)
    const cripto = 17 + t * 30

    data.push({
      mes: `${mes}/${ano}`,
      ibkr: Math.round(ibkr),
      savings: Math.round(Math.max(0, savings)),
      pension: Math.round(Math.max(0, pension)),
      cdi: Math.round(cdi),
      lci: Math.round(Math.max(0, lci)),
      im1: Math.round(im1),
      im2: Math.round(Math.max(0, im2)),
      cripto: Math.round(cripto),
    })
  }

  return data
}

const formatBRL = (v: number) => `R$${(v / 1000).toFixed(0)}k`

export default function PatrimonioChart() {
  const data = gerarDadosMock()

  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
      <h2 className="text-sm font-medium text-slate-300 mb-4">Evolução Patrimonial — Cenário Base</h2>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={3} angle={-35} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={formatBRL} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value, name) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <Area type="monotone" dataKey="im2" name="Im.2" stackId="1" stroke={COLORS.im2} fill={COLORS.im2} fillOpacity={0.7} />
          <Area type="monotone" dataKey="im1" name="Im.1" stackId="1" stroke={COLORS.im1} fill={COLORS.im1} fillOpacity={0.7} />
          <Area type="monotone" dataKey="ibkr" name="IBKR" stackId="1" stroke={COLORS.ibkr} fill={COLORS.ibkr} fillOpacity={0.7} />
          <Area type="monotone" dataKey="lci" name="LCI" stackId="1" stroke={COLORS.lci} fill={COLORS.lci} fillOpacity={0.7} />
          <Area type="monotone" dataKey="cdi" name="CDI" stackId="1" stroke={COLORS.cdi} fill={COLORS.cdi} fillOpacity={0.7} />
          <Area type="monotone" dataKey="savings" name="Savings" stackId="1" stroke={COLORS.savings} fill={COLORS.savings} fillOpacity={0.7} />
          <Area type="monotone" dataKey="pension" name="Pension" stackId="1" stroke={COLORS.pension} fill={COLORS.pension} fillOpacity={0.7} />
          <Area type="monotone" dataKey="cripto" name="Cripto" stackId="1" stroke={COLORS.cripto} fill={COLORS.cripto} fillOpacity={0.7} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
