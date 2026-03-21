#!/usr/bin/env python3
"""
Extrai dados das simulações dos 3 planos e popula patrimonio_calculado no Supabase.
Executa cada script Python com reportlab mockado para capturar apenas os dados.
"""
import sys
import os
import json
import types
import urllib.request

# ── CONFIG ──
SUPABASE_URL = "https://frdvafcdxxaptfiiveeu.supabase.co"
SUPABASE_KEY = "sb_secret_QeNNWSFjA3yOMckA3Ghomw_JaraEVYe"
N_MONTHS = 84
CAMBIO = 5.80


def cripto_at_fallback(m):
    """Fallback cripto_at — mesma lógica dos scripts Master/Sprint.
    Base: USD 2.917 × R$5.80. Aportes USD 300/mês de mar a jul/2026.
    Crescimento 20% a.a."""
    rate = 0.20 / 12
    base = 2_917 * CAMBIO  # R$16.919
    if m < 2:
        return base * ((1 + rate) ** m)
    aporte = 300 * CAMBIO
    bal = base * ((1 + rate) ** 2)
    for i in range(2, m + 1):
        bal = bal * (1 + rate)
        if i <= 6:
            bal += aporte
    return bal

SCRIPTS = {
    'master': os.path.expanduser(
        '~/Documentos/Plano financeiro/Claude/relatorio_master_v23_v4.py'),
    'sprint': os.path.expanduser(
        '~/Documentos/Plano financeiro/Claude/sprint2027_v3_v4.py'),
    'terceira_margem': os.path.expanduser(
        '~/Documentos/Plano financeiro/Claude/terceira_margem_v22_v4.py'),
}


# ── MOCK REPORTLAB ──
def mock_reportlab():
    """Cria módulos falsos de reportlab para não precisar instalar."""
    mock = types.ModuleType('reportlab')
    for sub in ['lib', 'lib.pagesizes', 'lib.styles', 'lib.units', 'lib.colors',
                'lib.enums', 'platypus']:
        mod = types.ModuleType(f'reportlab.{sub}')
        # Adiciona atributos comuns como stubs
        mod.A4 = (595, 842)
        mod.cm = 28.35
        mod.TA_LEFT = 0; mod.TA_CENTER = 1; mod.TA_RIGHT = 2
        mod.colors = type('Colors', (), {'black': '#000', 'white': '#fff',
                                          'HexColor': lambda *a, **kw: '#000'})()
        # Stubs para classes
        for cls_name in ['SimpleDocTemplate', 'Paragraph', 'Spacer', 'Table',
                         'KeepTogether', 'TableStyle', 'HRFlowable', 'Image',
                         'PageBreak', 'getSampleStyleSheet', 'ParagraphStyle']:
            setattr(mod, cls_name, lambda *a, **kw: None)
        sys.modules[f'reportlab.{sub}'] = mod
    sys.modules['reportlab'] = mock


# ── EXECUTE SCRIPT AND CAPTURE NAMESPACE ──
def run_script(path):
    """Executa script Python e retorna o namespace com todas as variáveis."""
    print(f"  Executando {os.path.basename(path)}...")
    with open(path, 'r') as f:
        code = f.read()

    # Remove a parte de geração de PDF (SimpleDocTemplate.build)
    # e suprime plt.savefig / plt.show
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    _orig_savefig = plt.savefig
    _orig_show = plt.show
    plt.savefig = lambda *a, **kw: None
    plt.show = lambda *a, **kw: None

    ns = {'__name__': '__extract__', '__file__': path}
    try:
        exec(compile(code, path, 'exec'), ns)
    except SystemExit:
        pass
    except Exception as e:
        print(f"  AVISO: {e}")

    plt.savefig = _orig_savefig
    plt.show = _orig_show
    plt.close('all')

    return ns


# ── EXTRACT MASTER DATA ──
def extract_master(ns):
    """Extrai dados do Master — 4 cenários salariais."""
    print("  Extraindo Master...")
    sims = ns['sims']
    MIGRATE_M = ns['MIGRATE_M']
    CAMBIO = ns['CAMBIO']
    OURO_FRAC = ns['OURO_FRAC']

    # Cenários compostos para ultra e otim
    ultra_ibkr = ns.get('sim_ultra_comp_ibkr', {})
    ultra_cdi = ns.get('sim_ultra_comp_cdi', {})
    ultra_lci = ns.get('sim_ultra_comp_lci', {})
    ultra_fundo = ns.get('sim_ultra_comp_fundo', {})
    otim_ibkr = ns.get('sim_otim_comp_ibkr', {})
    otim_cdi = ns.get('sim_otim_comp_cdi', {})
    otim_lci = ns.get('sim_otim_comp_lci', {})
    otim_fundo = ns.get('sim_otim_comp_fundo', {})

    scenario_map = {
        'ultra': 'ultra', 'pessim': 'pessim',
        'inter': 'base', 'otim': 'otim'
    }

    rows = []
    for sim_key, cenario_db in scenario_map.items():
        for m in range(N_MONTHS):
            # Para ultra e otim, usar cenários compostos
            if sim_key == 'ultra' and ultra_ibkr:
                ibkr_val = ultra_ibkr.get(m, 0)
                cdi_val = ultra_cdi.get(m, 0)
                lci_val = ultra_lci.get(m, 0)
                fundo_val = ultra_fundo.get(m, 0)
            elif sim_key == 'otim' and otim_ibkr:
                ibkr_val = otim_ibkr.get(m, 0)
                cdi_val = otim_cdi.get(m, 0)
                lci_val = otim_lci.get(m, 0)
                fundo_val = otim_fundo.get(m, 0)
            else:
                ibkr_val = sims[sim_key]['ibkr'].get(m, 0)
                cdi_val = sims[sim_key]['cdi'].get(m, 0)
                lci_val = sims[sim_key]['lci'].get(m, 0)
                fundo_val = sims[sim_key]['fundo'].get(m, 0)

            # Ouro é ~8% do IBKR total
            ouro_val = ibkr_val * OURO_FRAC / (1 - OURO_FRAC) if ibkr_val > 0 else 0
            ibkr_net = ibkr_val  # ibkr_o já inclui ouro no script

            sav = ns['savings_raw'](m) if m < MIGRATE_M else 0
            pen = ns['pension_raw'](m) if m < MIGRATE_M else 0
            cripto = ns['cripto_at'](m)
            im1 = ns['im1_mkt'](m)
            im2 = ns['im2_mkt'](m)

            # Renda passiva
            rim = ns['renda_total_im'](m)

            pat_total = ibkr_net + sav + pen + cdi_val + lci_val + fundo_val + cripto + im1 + im2

            ano = 2026 + m // 12
            mes = (m % 12) + 1
            data_ref = f"{ano}-{mes:02d}-01"

            rows.append({
                'data_ref': data_ref,
                'plano': 'master',
                'cenario': cenario_db,
                'patrimonio_total_brl': round(pat_total, 2),
                'ibkr_brl': round(ibkr_net, 2),
                'cdi_brl': round(cdi_val, 2),
                'lci_brl': round(lci_val, 2),
                'im1_brl': round(im1, 2),
                'im2_brl': round(im2, 2),
                'savings_brl': round(sav, 2),
                'pension_brl': round(pen, 2),
                'cripto_brl': round(cripto, 2),
                'fundo_sar_brl': round(fundo_val, 2),
                'ouro_brl': round(ouro_val, 2),
                'renda_passiva_brl': round(rim, 2),
            })
    return rows


# ── EXTRACT SPRINT DATA ──
def extract_sprint(ns):
    """Extrai dados do Sprint — 4 cenários salariais."""
    print("  Extraindo Sprint...")
    sims = ns['sims']
    MIGRATE_M = ns['MIGRATE_M']
    OURO_FRAC = ns['OURO_FRAC']

    scenario_map = {
        'ultra': 'ultra', 'pessim': 'pessim',
        'inter': 'base', 'otim': 'otim'
    }

    # Compostos
    ultra_ibkr = ns.get('sim_ultra_comp_ibkr', {})
    ultra_cdi = ns.get('sim_ultra_comp_cdi', {})
    ultra_lci = ns.get('sim_ultra_comp_lci', {})
    ultra_fundo = ns.get('sim_ultra_comp_fundo', {})
    otim_ibkr = ns.get('sim_otim_comp_ibkr', {})
    otim_cdi = ns.get('sim_otim_comp_cdi', {})
    otim_lci = ns.get('sim_otim_comp_lci', {})
    otim_fundo = ns.get('sim_otim_comp_fundo', {})

    rows = []
    for sim_key, cenario_db in scenario_map.items():
        for m in range(N_MONTHS):
            if sim_key == 'ultra' and ultra_ibkr:
                ibkr_val = ultra_ibkr.get(m, 0)
                cdi_val = ultra_cdi.get(m, 0)
                lci_val = ultra_lci.get(m, 0)
                fundo_val = ultra_fundo.get(m, 0)
            elif sim_key == 'otim' and otim_ibkr:
                ibkr_val = otim_ibkr.get(m, 0)
                cdi_val = otim_cdi.get(m, 0)
                lci_val = otim_lci.get(m, 0)
                fundo_val = otim_fundo.get(m, 0)
            else:
                ibkr_val = sims[sim_key]['ibkr'].get(m, 0)
                cdi_val = sims[sim_key]['cdi'].get(m, 0)
                lci_val = sims[sim_key]['lci'].get(m, 0)
                fundo_val = sims[sim_key]['fundo'].get(m, 0)

            ouro_val = ibkr_val * OURO_FRAC / (1 - OURO_FRAC) if ibkr_val > 0 else 0

            sav = ns['savings_raw'](m) if m < MIGRATE_M else 0
            pen = ns['pension_raw'](m) if m < MIGRATE_M else 0
            cripto = ns['cripto_at'](m)
            im1 = ns['im1_mkt'](m)

            # Sprint im2_mkt pode ter assinatura diferente
            im2_fn = ns.get('im2_mkt')
            try:
                im2 = im2_fn(m)
            except TypeError:
                im2 = im2_fn(m, 0.10)

            rim_fn = ns.get('renda_total_im')
            rim = rim_fn(m) if rim_fn else 0

            pat_total = ibkr_val + sav + pen + cdi_val + lci_val + fundo_val + cripto + im1 + im2

            ano = 2026 + m // 12
            mes = (m % 12) + 1
            data_ref = f"{ano}-{mes:02d}-01"

            rows.append({
                'data_ref': data_ref,
                'plano': 'sprint',
                'cenario': cenario_db,
                'patrimonio_total_brl': round(pat_total, 2),
                'ibkr_brl': round(ibkr_val, 2),
                'cdi_brl': round(cdi_val, 2),
                'lci_brl': round(lci_val, 2),
                'im1_brl': round(im1, 2),
                'im2_brl': round(im2, 2),
                'savings_brl': round(sav, 2),
                'pension_brl': round(pen, 2),
                'cripto_brl': round(cripto, 2),
                'fundo_sar_brl': round(fundo_val, 2),
                'ouro_brl': round(ouro_val, 2),
                'renda_passiva_brl': round(rim, 2),
            })
    return rows


# ── EXTRACT TERCEIRA MARGEM DATA ──
def extract_tm(ns):
    """Extrai dados do TM — 3 cenários (pessim, base, otim)."""
    print("  Extraindo Terceira Margem...")

    # TM retorna hist dict diferente — sims[sc_key] = {m: {dict de campos}}
    # Ou pode estar como sims = {key: resultado de simular_tm}

    scenario_map = {'pessim': 'pessim', 'base': 'base', 'otim': 'otim'}
    MIGRATE_M = ns.get('MIGRATE_M', 26)

    rows = []
    for sim_key, cenario_db in scenario_map.items():
        # TM pode ter sims como dict de hist ou pode ter variáveis separadas
        sims = ns.get('sims', {})

        if sim_key not in sims:
            print(f"    AVISO: cenário '{sim_key}' não encontrado no TM, pulando")
            continue

        hist = sims[sim_key]

        for m in range(N_MONTHS):
            if isinstance(hist, dict) and m in hist and isinstance(hist[m], dict):
                # TM format: hist[m] = {'ibkr': ..., 'cdi': ..., 'im1': ..., ...}
                h = hist[m]
                ibkr_val = h.get('ibkr', 0)
                cdi_val = h.get('cdi', h.get('cdi_res', 0))
                lci_val = h.get('lci', 0)
                # Se cdi inclui lci, separar
                if 'cdi_res' in h and 'lci' in h:
                    cdi_val = h['cdi_res']
                    lci_val = h['lci']
                elif 'cdi' in h and 'lci' not in h:
                    # cdi pode ser cdi_res + lci combinados
                    cdi_val = h['cdi']
                    lci_val = 0

                fundo_val = h.get('fundo_sar', 0)
                sav = h.get('savings', 0)
                pen = h.get('pension', 0)
                im1 = h.get('im1', 0)
                im2 = h.get('im2', 0)
                rim = h.get('rim', h.get('rim1', 0) + h.get('rim2', 0))
                pat = h.get('pat', 0)

                # cripto — TM não define cripto_at, usar fallback
                cripto_fn = ns.get('cripto_at', cripto_at_fallback)
                cripto = cripto_fn(m)

                ouro_val = ibkr_val * 0.08 / 0.92 if ibkr_val > 0 else 0

                if pat > 100:  # pat está em milhões
                    pat_total = pat * 1e6
                else:
                    pat_total = ibkr_val + cdi_val + lci_val + fundo_val + sav + pen + im1 + im2 + cripto

            else:
                # Fallback: usar dicts separados como Master/Sprint
                ibkr_val = hist.get('ibkr', {}).get(m, 0) if isinstance(hist.get('ibkr'), dict) else 0
                cdi_val = hist.get('cdi', {}).get(m, 0) if isinstance(hist.get('cdi'), dict) else 0
                lci_val = hist.get('lci', {}).get(m, 0) if isinstance(hist.get('lci'), dict) else 0
                fundo_val = hist.get('fundo', {}).get(m, 0) if isinstance(hist.get('fundo'), dict) else 0

                sav = ns['savings_raw'](m) if m < MIGRATE_M else 0
                pen = ns['pension_raw'](m) if m < MIGRATE_M else 0
                cripto = ns.get('cripto_at', cripto_at_fallback)(m)
                im1 = ns.get('im1_mkt', lambda m: 0)(m)
                im2 = ns.get('im2_mkt', lambda m: 0)(m)
                rim = ns.get('renda_total_im', lambda m: 0)(m)
                ouro_val = ibkr_val * 0.08 / 0.92 if ibkr_val > 0 else 0
                pat_total = ibkr_val + sav + pen + cdi_val + lci_val + fundo_val + cripto + im1 + im2

            ano = 2026 + m // 12
            mes = (m % 12) + 1
            data_ref = f"{ano}-{mes:02d}-01"

            rows.append({
                'data_ref': data_ref,
                'plano': 'terceira_margem',
                'cenario': cenario_db,
                'patrimonio_total_brl': round(pat_total, 2),
                'ibkr_brl': round(ibkr_val, 2),
                'cdi_brl': round(cdi_val, 2),
                'lci_brl': round(lci_val, 2),
                'im1_brl': round(im1, 2),
                'im2_brl': round(im2, 2),
                'savings_brl': round(sav, 2),
                'pension_brl': round(pen, 2),
                'cripto_brl': round(cripto, 2),
                'fundo_sar_brl': round(fundo_val, 2),
                'ouro_brl': round(ouro_val, 2),
                'renda_passiva_brl': round(rim, 2),
            })
    return rows


# ── SUPABASE UPSERT ──
def upsert_to_supabase(rows):
    """Insere dados no Supabase via REST API com upsert."""
    print(f"\nEnviando {len(rows)} linhas para o Supabase...")

    # Upsert em batches de 500
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        data = json.dumps(batch).encode('utf-8')

        url = f"{SUPABASE_URL}/rest/v1/patrimonio_calculado?on_conflict=data_ref,plano,cenario"
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('apikey', SUPABASE_KEY)
        req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
        req.add_header('Content-Type', 'application/json')
        req.add_header('Prefer', 'resolution=merge-duplicates')

        try:
            resp = urllib.request.urlopen(req)
            status = resp.getcode()
            print(f"  Batch {i//batch_size + 1}: {status} ({len(batch)} rows)")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  ERRO batch {i//batch_size + 1}: {e.code} — {body[:200]}")

    print("Concluído.")


# ── EXTRACT SIMULACOES EXTRAS ──
def extract_extras(ns, plano):
    """Extrai Monte Carlo, Stress Test, Cisne Negro e Fluxo Mensal."""
    import numpy as np
    extras = []

    # ── MONTE CARLO ──
    mc_ibkr = ns.get('mc_ibkr')
    mc_total = ns.get('mc_total')
    mc_renda = ns.get('mc_renda')
    if mc_ibkr is not None and len(mc_ibkr) > 0:
        print(f"  Monte Carlo: {len(mc_ibkr)} simulações")
        def percentiles(arr):
            p10, p50, p90 = np.percentile(arr, [10, 50, 90])
            return {'p10': round(float(p10), 3), 'p50': round(float(p50), 3), 'p90': round(float(p90), 3)}
        # Salvar histograma (bins) ao invés dos 5000 valores raw
        def histogram(arr, bins=50):
            counts, edges = np.histogram(arr, bins=bins)
            return {
                'counts': [int(c) for c in counts],
                'edges': [round(float(e), 3) for e in edges],
            }
        mc_data = {
            'n_sims': len(mc_ibkr),
            'ibkr': {'percentiles': percentiles(mc_ibkr), 'histogram': histogram(mc_ibkr)},
            'total': {'percentiles': percentiles(mc_total), 'histogram': histogram(mc_total)} if mc_total is not None else None,
            'renda': {'percentiles': percentiles(mc_renda), 'histogram': histogram(mc_renda)} if mc_renda is not None else None,
        }
        extras.append({'plano': plano, 'tipo': 'monte_carlo', 'dados': mc_data})
    else:
        print(f"  Monte Carlo: não encontrado")

    # ── STRESS TEST ──
    # Os scripts calculam stress_scenarios no namespace
    stress_data = []
    # Tentar extrair as séries de stress do namespace
    # Master/Sprint: stress como linhas de patrimônio
    MIGRATE_M = ns.get('MIGRATE_M', 38)
    TRANSITION_M = ns.get('TRANSITION_M', MIGRATE_M + 1)

    stress_params = [
        {'name': 'Base', 'ibkr_r': 0.08, 'ipca': 0.045, 'cambio': 5.80, 'occ': 1.0, 'color': '#185FA5', 'style': 'solid'},
        {'name': 'Moderado', 'ibkr_r': 0.06, 'ipca': 0.060, 'cambio': 5.20, 'occ': 0.85, 'color': '#EF9F27', 'style': 'solid'},
        {'name': 'Severo', 'ibkr_r': 0.04, 'ipca': 0.080, 'cambio': 4.80, 'occ': 0.80, 'color': '#E24B4A', 'style': 'solid'},
    ]

    # Calcular patrimônio sob stress usando total_pat ou similar
    total_pat_fn = ns.get('total_pat')
    sims = ns.get('sims', {})

    if total_pat_fn and sims:
        points = list(range(0, N_MONTHS, 4))
        for sp in stress_params:
            try:
                vals = [round(float(total_pat_fn(m, 'inter' if 'inter' in sims else 'base', sp.get('cambio', 0.10))), 3) for m in points]
                sp['data'] = vals
                sp['points'] = points
            except Exception:
                sp['data'] = []
        stress_data = stress_params
    elif sims:
        # Fallback: usar cenários existentes como proxy
        points = list(range(0, N_MONTHS, 4))
        for key_label in [('base', 'Base'), ('pessim', 'Pessimista'), ('otim', 'Otimista')]:
            key, label = key_label
            if key in sims:
                stress_data.append({
                    'name': label,
                    'data': [round(float(sims[key].get('ibkr', {}).get(m, 0) + sims[key].get('cdi', {}).get(m, 0) +
                                        sims[key].get('lci', {}).get(m, 0)) / 1e6, 3)
                             for m in points] if isinstance(sims[key], dict) and 'ibkr' in sims[key] else [],
                    'points': points,
                    'color': '#185FA5' if key == 'base' else '#EF9F27' if key == 'pessim' else '#1D9E75',
                    'style': 'solid',
                })

    if stress_data:
        extras.append({'plano': plano, 'tipo': 'stress_test', 'dados': {'scenarios': stress_data}})
        print(f"  Stress Test: {len(stress_data)} cenários")

    # ── CISNE NEGRO ──
    cisne_fn = ns.get('simular_cisne_negro')
    if cisne_fn:
        try:
            # A função retorna tupla (cdi_ini, cdi_final) ou float
            result_6m = cisne_fn(6)
            result_12m = cisne_fn(12)
            if isinstance(result_6m, tuple):
                cdi_base = float(result_6m[0])
                cdi_6m = float(result_6m[1])
                cdi_12m = float(result_12m[1])
            else:
                cdi_6m = float(result_6m)
                cdi_12m = float(result_12m)
                result_0 = cisne_fn(0)
                cdi_base = float(result_0[0]) if isinstance(result_0, tuple) else float(result_0)
            extras.append({'plano': plano, 'tipo': 'cisne_negro', 'dados': {
                'base': round(cdi_base, 0),
                'stress_6m': round(cdi_6m, 0),
                'stress_12m': round(cdi_12m, 0),
            }})
            print(f"  Cisne Negro: base={cdi_base:.0f}, 6m={cdi_6m:.0f}, 12m={cdi_12m:.0f}")
        except Exception as e:
            print(f"  Cisne Negro: erro — {e}")
    else:
        # Tentar extrair variáveis pré-calculadas
        cdi_ini_cn = ns.get('cdi_ini_cn')
        cdi_6m = ns.get('cdi_6m')
        cdi_12m = ns.get('cdi_12m')
        if cdi_ini_cn is not None:
            extras.append({'plano': plano, 'tipo': 'cisne_negro', 'dados': {
                'base': round(float(cdi_ini_cn), 0),
                'stress_6m': round(float(cdi_6m), 0),
                'stress_12m': round(float(cdi_12m), 0),
            }})
            print(f"  Cisne Negro: base={cdi_ini_cn:.0f}, 6m={cdi_6m:.0f}, 12m={cdi_12m:.0f}")
        else:
            print(f"  Cisne Negro: função não encontrada")

    # ── FLUXO MENSAL ──
    salary_scenarios = ns.get('SALARY_SCENARIOS', {})
    custo_vida_fn = ns.get('custo_vida')
    plano_saude_fn = ns.get('plano_saude') or ns.get('plano_saude_sprint')
    renda_total_fn = ns.get('renda_total_im')
    MANUT = ns.get('MANUT_MES', 2000)

    scenario_map = {'ultra': 'ultra', 'pessim': 'pessim', 'inter': 'base', 'otim': 'otim'}

    if custo_vida_fn and sims:
        fluxo = {}
        for sim_key, cenario_db in scenario_map.items():
            if sim_key not in salary_scenarios and sim_key not in sims:
                continue
            sal_val = salary_scenarios.get(sim_key, {}).get('sal', 0)
            SALARY_M = ns.get('SALARY_M', 47)
            meses = []
            for m in range(N_MONTHS):
                custo = 0
                sal = 0
                rim = 0
                if m >= TRANSITION_M:
                    m_ret = m - TRANSITION_M
                    custo = float(custo_vida_fn(m))
                    if plano_saude_fn:
                        try:
                            custo += float(plano_saude_fn(m_ret))
                        except Exception:
                            pass
                    custo += MANUT
                    sal = sal_val if m >= SALARY_M else 0
                if renda_total_fn:
                    try:
                        rim = float(renda_total_fn(m))
                    except Exception:
                        rim = 0
                excedente = rim + sal - custo if custo > 0 else 0
                ano = 2026 + m // 12
                mes_n = (m % 12) + 1
                meses.append({
                    'm': m,
                    'data': f"{ano}-{mes_n:02d}-01",
                    'renda': round(rim, 0),
                    'salario': round(sal, 0),
                    'custo': round(custo, 0),
                    'excedente': round(excedente, 0),
                })
            fluxo[cenario_db] = meses
        if fluxo:
            extras.append({'plano': plano, 'tipo': 'fluxo_mensal', 'dados': fluxo})
            print(f"  Fluxo Mensal: {len(fluxo)} cenários")

    return extras


def upsert_extras(extras):
    """Upsert simulacoes_extras no Supabase."""
    if not extras:
        return
    print(f"\nEnviando {len(extras)} extras para simulacoes_extras...")
    for item in extras:
        data = json.dumps(item).encode('utf-8')
        url = f"{SUPABASE_URL}/rest/v1/simulacoes_extras?on_conflict=plano,tipo"
        req = urllib.request.Request(url, data=data, method='POST')
        req.add_header('apikey', SUPABASE_KEY)
        req.add_header('Authorization', f'Bearer {SUPABASE_KEY}')
        req.add_header('Content-Type', 'application/json')
        req.add_header('Prefer', 'resolution=merge-duplicates')
        try:
            resp = urllib.request.urlopen(req)
            print(f"  {item['plano']}/{item['tipo']}: {resp.getcode()}")
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  ERRO {item['plano']}/{item['tipo']}: {e.code} — {body[:200]}")


# ── MAIN ──
def main():
    mock_reportlab()

    all_rows = []
    all_extras = []

    for plano, path in SCRIPTS.items():
        if not os.path.exists(path):
            print(f"AVISO: {path} não encontrado, pulando {plano}")
            continue

        print(f"\n{'='*60}")
        print(f"Processando: {plano.upper()}")
        print(f"{'='*60}")

        ns = run_script(path)

        if plano == 'master':
            rows = extract_master(ns)
        elif plano == 'sprint':
            rows = extract_sprint(ns)
        elif plano == 'terceira_margem':
            rows = extract_tm(ns)
        else:
            continue

        print(f"  {len(rows)} linhas extraídas")
        all_rows.extend(rows)

        # Extras
        extras = extract_extras(ns, plano)
        all_extras.extend(extras)

    if all_rows:
        upsert_to_supabase(all_rows)

    if all_extras:
        upsert_extras(all_extras)

    if not all_rows and not all_extras:
        print("Nenhum dado extraído.")


if __name__ == '__main__':
    main()
