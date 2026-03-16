import { useState, useMemo, useEffect } from "react";

// ─── localStorage-backed useState ───
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Sankey, Treemap } from "recharts";

// ─── NYC Tax Calculator ───
function calcNYCTaxes(grossIncome) {
  // 2025 brackets (approximate)
  // Federal
  const fedBrackets = [
    [11600, 0.10], [47150 - 11600, 0.12], [100525 - 47150, 0.22],
    [191950 - 100525, 0.24], [243725 - 191950, 0.32],
    [609350 - 243725, 0.35], [Infinity, 0.37]
  ];
  // NY State
  const nyBrackets = [
    [8500, 0.04], [11700 - 8500, 0.045], [13900 - 11700, 0.0525],
    [80650 - 13900, 0.0585], [215400 - 80650, 0.0625],
    [1077550 - 215400, 0.0685], [5000000 - 1077550, 0.0965],
    [25000000 - 5000000, 0.103], [Infinity, 0.109]
  ];
  // NYC local
  const nycBrackets = [
    [12000, 0.03078], [25000 - 12000, 0.03762],
    [50000 - 25000, 0.03819], [Infinity, 0.03876]
  ];

  function applyBrackets(income, brackets) {
    let tax = 0, remaining = income;
    for (const [width, rate] of brackets) {
      if (remaining <= 0) break;
      const taxable = Math.min(remaining, width);
      tax += taxable * rate;
      remaining -= taxable;
    }
    return tax;
  }

  const fica = Math.min(grossIncome, 168600) * 0.0765 + Math.max(0, grossIncome - 168600) * 0.0145 + Math.max(0, grossIncome - 200000) * 0.009;
  const federal = applyBrackets(grossIncome, fedBrackets);
  const nyState = applyBrackets(grossIncome, nyBrackets);
  const nycLocal = applyBrackets(grossIncome, nycBrackets);

  return { federal, nyState, nycLocal, fica, total: federal + nyState + nycLocal + fica };
}

// ─── Formatting ───
const fmt = (n) => "$" + Math.round(n).toLocaleString();
const fmtK = (n) => n >= 1000 ? "$" + (n / 1000).toFixed(0) + "k" : "$" + Math.round(n);

// ─── Color palette (soft, couple-friendly) ───
const COLORS = {
  primary: "#7C9FE3",
  secondary: "#E8A0BF",
  accent1: "#B5D8CC",
  accent2: "#F5D5A0",
  accent3: "#C4B5E0",
  accent4: "#F5B5B5",
  accent5: "#A0C9E8",
  accent6: "#D4E8A0",
  bg: "#FAFBFE",
  card: "#FFFFFF",
  text: "#3D4663",
  textLight: "#8892A8",
  border: "#E8ECF4",
  success: "#7DCFB6",
  warning: "#F5C87A",
  danger: "#F5A0A0",
};

const PIE_COLORS = ["#7C9FE3", "#E8A0BF", "#B5D8CC", "#F5D5A0", "#C4B5E0", "#F5B5B5", "#A0C9E8", "#D4E8A0"];

// ─── Shared Styles ───
const cardStyle = {
  background: COLORS.card,
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 2px 12px rgba(124,159,227,0.08)",
  border: `1px solid ${COLORS.border}`,
};

const labelStyle = { fontSize: 13, color: COLORS.textLight, marginBottom: 4, fontWeight: 500 };
const valueStyle = { fontSize: 22, fontWeight: 700, color: COLORS.text };
const h2Style = { fontSize: 18, fontWeight: 700, color: COLORS.text, margin: "0 0 16px 0" };

function Slider({ label, value, min, max, step, onChange, format, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={labelStyle}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: color || COLORS.primary }}>{(format || fmt)(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 6, borderRadius: 3,
          appearance: "none", background: `linear-gradient(to right, ${color || COLORS.primary} ${((value - min) / (max - min)) * 100}%, ${COLORS.border} ${((value - min) / (max - min)) * 100}%)`,
          outline: "none", cursor: "pointer",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 11, color: COLORS.textLight }}>{(format || fmt)(min)}</span>
        <span style={{ fontSize: 11, color: COLORS.textLight }}>{(format || fmt)(max)}</span>
      </div>
    </div>
  );
}

function CurrencyInput({ label, value, onChange, color, prefix, suffix }) {
  const [editing, setEditing] = useState(false);
  const [tempVal, setTempVal] = useState("");
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...labelStyle, marginBottom: 6 }}>{label}</div>
      {editing ? (
        <input
          autoFocus
          type="text"
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value.replace(/[^0-9.]/g, ""))}
          onBlur={() => { const n = parseFloat(tempVal); if (!isNaN(n)) onChange(n); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { const n = parseFloat(tempVal); if (!isNaN(n)) onChange(n); setEditing(false); } }}
          style={{
            width: "100%", padding: "12px 16px", fontSize: 18, fontWeight: 700,
            border: `2px solid ${color || COLORS.primary}`, borderRadius: 10,
            outline: "none", color: COLORS.text, background: `${color || COLORS.primary}08`,
            boxSizing: "border-box",
          }}
        />
      ) : (
        <div
          onClick={() => { setTempVal(String(value)); setEditing(true); }}
          style={{
            width: "100%", padding: "12px 16px", fontSize: 18, fontWeight: 700,
            border: `1.5px solid ${COLORS.border}`, borderRadius: 10,
            cursor: "pointer", color: color || COLORS.text, background: `${color || COLORS.primary}06`,
            transition: "border-color 0.2s", boxSizing: "border-box",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span>{prefix || ""}{fmt(value)}{suffix || ""}</span>
          <span style={{ fontSize: 12, color: COLORS.textLight, fontWeight: 400 }}>click to edit</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ ...cardStyle, padding: 18, flex: 1, minWidth: 160 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
        <span style={labelStyle}>{label}</span>
      </div>
      <div style={{ ...valueStyle, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TabButton({ active, label, onClick, icon }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 20px", border: "none", borderRadius: 10, cursor: "pointer",
      background: active ? COLORS.primary : "transparent",
      color: active ? "#fff" : COLORS.textLight,
      fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6,
      transition: "all 0.2s",
    }}>
      <span>{icon}</span> {label}
    </button>
  );
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: COLORS.text }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, color: p.color, display: "flex", gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
export default function MergeConflict() {
  const [tab, setTab] = useState("overview");

  // ─── Income inputs ───
  const [hisSalary, setHisSalary] = useLocalStorage("mc_hisSalary", 130000);
  const [hisBonus, setHisBonus] = useLocalStorage("mc_hisBonus", 15000);
  const [partnerSalary, setPartnerSalary] = useLocalStorage("mc_partnerSalary", 110000);
  const [hisContribPct, setHisContribPct] = useLocalStorage("mc_hisContribPct", 100);
  const [partnerContribPct, setPartnerContribPct] = useLocalStorage("mc_partnerContribPct", 100);
  const [investmentAssets, setInvestmentAssets] = useLocalStorage("mc_investmentAssets", 120000);
  const [investReturnRate, setInvestReturnRate] = useLocalStorage("mc_investReturnRate", 7);
  const [monthlyInvestDraw, setMonthlyInvestDraw] = useLocalStorage("mc_monthlyInvestDraw", 0);
  const [partnerStocks, setPartnerStocks] = useLocalStorage("mc_partnerStocks", 25000);
  const [partnerStockReturn, setPartnerStockReturn] = useLocalStorage("mc_partnerStockReturn", 8);

  // ─── Home inputs ───
  const [homePrice, setHomePrice] = useLocalStorage("mc_homePrice", 1200000);
  const [downPayment, setDownPayment] = useLocalStorage("mc_downPayment", 240000);
  const [monthlyTaxes, setMonthlyTaxes] = useLocalStorage("mc_monthlyTaxes", 850);
  const [monthlyHOA, setMonthlyHOA] = useLocalStorage("mc_monthlyHOA", 1200);
  const [mortgageRate, setMortgageRate] = useLocalStorage("mc_mortgageRate", 6.75);

  // ─── Children ───
  const [nannyMonthly, setNannyMonthly] = useLocalStorage("mc_nannyMonthly", 0);
  const [dayCareMonthly, setDayCareMonthly] = useLocalStorage("mc_dayCareMonthly", 0);
  const [privateSchoolAnnual, setPrivateSchoolAnnual] = useLocalStorage("mc_privateSchoolAnnual", 0);

  // ─── Living Expenses (Annual) ───
  const [clubMemberships, setClubMemberships] = useLocalStorage("mc_clubMemberships", 0);
  const [annualOther, setAnnualOther] = useLocalStorage("mc_annualOther", 0);

  // ─── Living Expenses (Monthly) ───
  const [healthFitness, setHealthFitness] = useLocalStorage("mc_healthFitness", 150);
  const [foodDining, setFoodDining] = useLocalStorage("mc_foodDining", 1500);
  const [monthlyOther, setMonthlyOther] = useLocalStorage("mc_monthlyOther", 600);

  // ─── Big Purchase Fund ───
  const [currentFundBalance, setCurrentFundBalance] = useLocalStorage("mc_currentFundBalance", 15000);
  const [monthlyFundContrib, setMonthlyFundContrib] = useLocalStorage("mc_monthlyFundContrib", 1000);
  const [purchaseQueue, setPurchaseQueue] = useLocalStorage("mc_purchaseQueue", [
    { id: 1, name: "Wedding", cost: 60000 },
    { id: 2, name: "Honeymoon", cost: 15000 },
  ]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");

  // ─── Existing Assets ───
  const miamiPropertyValue = 700000;
  const nycEquity = 300000;

  // ═══ CALCULATIONS ═══
  const calc = useMemo(() => {
    // Gross incomes
    const hisGross = hisSalary + hisBonus;
    const partnerGross = partnerSalary;
    const combinedGross = hisGross + partnerGross;

    // Taxes
    const hisTax = calcNYCTaxes(hisGross);
    const partnerTax = calcNYCTaxes(partnerGross);
    const hisNet = hisGross - hisTax.total;
    const partnerNet = partnerGross - partnerTax.total;
    const combinedNet = hisNet + partnerNet;
    const combinedMonthlyNet = combinedNet / 12;

    // Household contributions from salary
    const hisMonthlyContrib = (hisNet / 12) * (hisContribPct / 100);
    const partnerMonthlyContrib = (partnerNet / 12) * (partnerContribPct / 100);

    // Investment income — user sets desired monthly after-tax draw
    const totalInvestReturn = investmentAssets * (investReturnRate / 100);
    // Back-calculate: find pre-tax draw that yields monthlyInvestDraw after NYC taxes
    // Use binary search to solve: grossDraw - tax(grossDraw) = monthlyInvestDraw * 12
    const targetAnnualAfterTax = monthlyInvestDraw * 12;
    let lo = 0, hi = Math.max(totalInvestReturn, targetAnnualAfterTax * 2.5);
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      const netMid = mid - calcNYCTaxes(mid).total;
      if (netMid < targetAnnualAfterTax) lo = mid; else hi = mid;
    }
    const investDrawPreTax = Math.min((lo + hi) / 2, totalInvestReturn);
    const investTax = calcNYCTaxes(investDrawPreTax);
    const investIncomeAfterTax = investDrawPreTax - investTax.total;
    const investIncomeMonthlyAfterTax = investIncomeAfterTax / 12;
    const reinvested = totalInvestReturn - investDrawPreTax;

    // Partner stock returns (reinvested fully for simplicity)
    const partnerStockReturns = partnerStocks * (partnerStockReturn / 100);

    // Interest-only loan calculation
    const loanAmount = Math.max(0, homePrice - downPayment);
    const monthlyMortgage = loanAmount * (mortgageRate / 100) / 12;
    const monthlyPropertyTax = monthlyTaxes;
    const totalMonthlyHousing = monthlyMortgage + monthlyPropertyTax + monthlyHOA;

    // Children costs
    const monthlyChildren = nannyMonthly + dayCareMonthly + (privateSchoolAnnual / 12);

    // Living expenses
    const annualLiving = clubMemberships + annualOther;
    const monthlyLivingDirect = healthFitness + foodDining + monthlyOther;
    const monthlyLiving = monthlyLivingDirect + (annualLiving / 12);

    // Total monthly available (contributed salary + investment draw after tax)
    const totalMonthlyIncome = hisMonthlyContrib + partnerMonthlyContrib + investIncomeMonthlyAfterTax;

    // Left over for savings (before fund contribution)
    const leftOverBeforeFund = totalMonthlyIncome - totalMonthlyHousing - monthlyChildren - monthlyLiving;

    // Total monthly spending
    const totalMonthlySpending = totalMonthlyHousing + monthlyChildren + monthlyLiving + monthlyFundContrib;

    // Monthly surplus
    const monthlySurplus = totalMonthlyIncome - totalMonthlySpending;

    // Total net worth
    const totalNetWorth = investmentAssets + partnerStocks + miamiPropertyValue + nycEquity;

    return {
      hisGross, partnerGross, combinedGross,
      hisTax, partnerTax, hisNet, partnerNet,
      combinedNet, combinedMonthlyNet,
      hisMonthlyContrib, partnerMonthlyContrib,
      investDrawPreTax, investTax, investIncomeMonthlyAfterTax, investIncomeAfterTax,
      reinvested, totalInvestReturn, partnerStockReturns,
      loanAmount, monthlyMortgage, monthlyPropertyTax, totalMonthlyHousing, monthlyChildren,
      annualLiving, monthlyLivingDirect, monthlyLiving, leftOverBeforeFund,
      totalMonthlyIncome, totalMonthlySpending, monthlySurplus,
      totalNetWorth,
    };
  }, [hisSalary, hisBonus, partnerSalary, hisContribPct, partnerContribPct,
    investmentAssets, investReturnRate, monthlyInvestDraw,
    partnerStocks, partnerStockReturn, homePrice, downPayment, mortgageRate,
    monthlyTaxes, monthlyHOA, nannyMonthly, dayCareMonthly, privateSchoolAnnual,
    clubMemberships, annualOther, healthFitness, foodDining, monthlyOther,
    monthlyFundContrib]);

  // ═══ CHART DATA ═══
  const incomeBreakdown = [
    { name: "His Contribution", value: Math.round(calc.hisMonthlyContrib) },
    { name: "Her Contribution", value: Math.round(calc.partnerMonthlyContrib) },
    { name: "Investment Draw", value: Math.round(calc.investIncomeMonthlyAfterTax) },
  ];

  const spendingBreakdown = [
    { name: "Housing", value: Math.round(calc.totalMonthlyHousing) },
    { name: "Children", value: Math.round(calc.monthlyChildren) },
    { name: "Health/Fitness", value: healthFitness },
    { name: "Food & Dining", value: foodDining },
    { name: "Clubs", value: Math.round(clubMemberships / 12) },
    { name: "Other Living", value: Math.round(monthlyOther + annualOther / 12) },
    { name: "Purchase Fund", value: monthlyFundContrib },
  ];

  const taxComparison = [
    { name: "His", Federal: Math.round(calc.hisTax.federal), "NY State": Math.round(calc.hisTax.nyState), "NYC Local": Math.round(calc.hisTax.nycLocal), FICA: Math.round(calc.hisTax.fica) },
    { name: "Hers", Federal: Math.round(calc.partnerTax.federal), "NY State": Math.round(calc.partnerTax.nyState), "NYC Local": Math.round(calc.partnerTax.nycLocal), FICA: Math.round(calc.partnerTax.fica) },
  ];

  const whereItGoes = [
    { name: "Federal Tax", value: Math.round((calc.hisTax.federal + calc.partnerTax.federal) / 12) },
    { name: "State Tax", value: Math.round((calc.hisTax.nyState + calc.partnerTax.nyState) / 12) },
    { name: "NYC Tax", value: Math.round((calc.hisTax.nycLocal + calc.partnerTax.nycLocal) / 12) },
    { name: "FICA", value: Math.round((calc.hisTax.fica + calc.partnerTax.fica) / 12) },
    { name: "Housing", value: Math.round(calc.totalMonthlyHousing) },
    { name: "Children", value: Math.round(calc.monthlyChildren) },
    { name: "Living", value: Math.round(calc.monthlyLiving) },
    { name: "Purchase Fund", value: monthlyFundContrib },
    { name: "Savings", value: Math.max(0, Math.round(calc.monthlySurplus)) },
  ];

  const surplusColor = calc.monthlySurplus >= 0 ? COLORS.success : COLORS.danger;

  // ═══ RENDER ═══
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #F0F4FF 0%, #FFF5F9 50%, #F0FFF4 100%)`, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: COLORS.text }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #7C9FE3 0%, #E8A0BF 100%)", padding: "32px 40px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>💍</span>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Merge Conflict</h1>
          </div>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 15 }}>Your shared financial life, beautifully planned</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 4, padding: "16px 0", flexWrap: "wrap", background: "rgba(255,255,255,0.6)", borderRadius: 12, marginTop: -12, paddingLeft: 12, paddingRight: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          {[
            ["overview", "Overview", "📋"],
            ["income", "Income & Taxes", "💵"],
            ["home", "Primary Home", "🏠"],
            ["children", "Children", "👶"],
            ["living", "Living Expenses", "🛒"],
            ["goals", "Savings & Goals", "🎯"],
            ["flow", "Money Flow", "🌊"],
          ].map(([key, label, icon]) => (
            <TabButton key={key} active={tab === key} label={label} icon={icon} onClick={() => setTab(key)} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 60px" }}>

        {/* ═══ OVERVIEW TAB ═══ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Household Contribution Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
              {/* Your Contribution */}
              <div style={cardStyle}>
                <h2 style={{ ...h2Style, color: COLORS.primary }}>👤 His Contribution</h2>
                <Slider label="Contribute to Household" value={hisContribPct} min={0} max={100} step={5} onChange={setHisContribPct} color={COLORS.primary} format={(v) => v + "%"} />
                <div style={{ background: `${COLORS.primary}0D`, borderRadius: 12, padding: 14, marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>Net Monthly Pay</span>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{fmt(calc.hisNet / 12)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>To Household</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: COLORS.primary }}>{fmt(calc.hisMonthlyContrib)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={labelStyle}>Personal</span>
                    <span style={{ fontWeight: 600, color: COLORS.textLight }}>{fmt(calc.hisNet / 12 - calc.hisMonthlyContrib)}</span>
                  </div>
                </div>
              </div>

              {/* Partner Contribution */}
              <div style={cardStyle}>
                <h2 style={{ ...h2Style, color: COLORS.secondary }}>👩 Her Contribution</h2>
                <Slider label="Contribute to Household" value={partnerContribPct} min={0} max={100} step={5} onChange={setPartnerContribPct} color={COLORS.secondary} format={(v) => v + "%"} />
                <div style={{ background: `${COLORS.secondary}0D`, borderRadius: 12, padding: 14, marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>Net Monthly Pay</span>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{fmt(calc.partnerNet / 12)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>To Household</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: COLORS.secondary }}>{fmt(calc.partnerMonthlyContrib)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={labelStyle}>Personal</span>
                    <span style={{ fontWeight: 600, color: COLORS.textLight }}>{fmt(calc.partnerNet / 12 - calc.partnerMonthlyContrib)}</span>
                  </div>
                </div>
              </div>

              {/* Investment Draw */}
              <div style={cardStyle}>
                <h2 style={{ ...h2Style, color: "#5BAE9F" }}>📈 Investment Draw</h2>
                <CurrencyInput label="Drawn $/mo for Household (after tax)" value={monthlyInvestDraw} onChange={setMonthlyInvestDraw} color="#5BAE9F" />
                <div style={{ background: `${COLORS.accent1}0D`, borderRadius: 12, padding: 14, marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>Portfolio Returns</span>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{fmt(calc.totalInvestReturn)}/yr</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>Pre-Tax Draw</span>
                    <span style={{ fontWeight: 600, color: COLORS.warning }}>{fmt(calc.investDrawPreTax)}/yr</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>Taxes on Draw</span>
                    <span style={{ fontWeight: 600, color: COLORS.danger }}>{fmt(calc.investTax.total)}/yr</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={labelStyle}>To Household</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: "#5BAE9F" }}>{fmt(calc.investIncomeMonthlyAfterTax)}/mo</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", borderTop: `1px solid ${COLORS.border}` }}>
                    <span style={labelStyle}>Reinvested (growing)</span>
                    <span style={{ fontWeight: 700, color: COLORS.primary }}>{fmt(calc.reinvested)}/yr</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Household Income + Surplus */}
            <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${COLORS.primary}08, ${COLORS.secondary}08, ${COLORS.accent1}08)` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={labelStyle}>Total Household Income</div>
                  <div style={{ fontWeight: 800, fontSize: 26, color: COLORS.success }}>{fmt(calc.totalMonthlyIncome)}<span style={{ fontSize: 14, fontWeight: 500 }}>/mo</span></div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={labelStyle}>Total Spending</div>
                  <div style={{ fontWeight: 800, fontSize: 26, color: COLORS.warning }}>{fmt(calc.totalMonthlySpending)}<span style={{ fontSize: 14, fontWeight: 500 }}>/mo</span></div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={labelStyle}>Monthly Surplus</div>
                  <div style={{ fontWeight: 800, fontSize: 26, color: surplusColor }}>{fmt(calc.monthlySurplus)}<span style={{ fontSize: 14, fontWeight: 500 }}>/mo</span></div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={labelStyle}>Annual Surplus</div>
                  <div style={{ fontWeight: 800, fontSize: 26, color: surplusColor }}>{fmt(calc.monthlySurplus * 12)}<span style={{ fontSize: 14, fontWeight: 500 }}>/yr</span></div>
                </div>
              </div>
            </div>

            {/* Income vs Spending Pie Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={cardStyle}>
                <h2 style={h2Style}>Household Income Sources</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={incomeBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${fmtK(value)}`} labelLine={true}>
                      {incomeBreakdown.map((_, i) => <Cell key={i} fill={[COLORS.primary, COLORS.secondary, "#5BAE9F"][i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={cardStyle}>
                <h2 style={h2Style}>Monthly Spending Breakdown</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={spendingBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${fmtK(value)}`} labelLine={true}>
                      {spendingBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Budget Health Bar */}
            <div style={cardStyle}>
              <h2 style={h2Style}>Monthly Budget Health</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Housing", amount: calc.totalMonthlyHousing, color: PIE_COLORS[0], recommended: 30 },
                  { label: "Children", amount: calc.monthlyChildren, color: COLORS.secondary, recommended: 15 },
                  { label: "Living Expenses", amount: calc.monthlyLiving, color: COLORS.accent3, recommended: 25 },
                  { label: "Purchase Fund", amount: monthlyFundContrib, color: PIE_COLORS[2], recommended: 10 },
                  { label: "Savings/Surplus", amount: Math.max(0, calc.monthlySurplus), color: COLORS.success, recommended: 20 },
                ].map((item) => {
                  const pct = (item.amount / calc.totalMonthlyIncome) * 100;
                  return (
                    <div key={item.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 13, color: COLORS.textLight }}>{fmt(item.amount)}/mo ({pct.toFixed(1)}% of income — guideline: ~{item.recommended}%)</span>
                      </div>
                      <div style={{ height: 10, background: COLORS.border, borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}CC)`, borderRadius: 5, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ═══ INCOME & TAXES TAB ═══ */}
        {tab === "income" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Your Income */}
              <div style={cardStyle}>
                <h2 style={{ ...h2Style, color: COLORS.primary }}>👤 His Income</h2>
                <CurrencyInput label="Base Salary" value={hisSalary} onChange={setHisSalary} color={COLORS.primary} />
                <CurrencyInput label="Annual Bonus" value={hisBonus} onChange={setHisBonus} color={COLORS.primary} />
                <div style={{ background: `${COLORS.primary}0D`, borderRadius: 12, padding: 16, marginTop: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><span style={labelStyle}>Gross Annual</span><div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(calc.hisGross)}</div></div>
                    <div><span style={labelStyle}>Total Tax</span><div style={{ fontWeight: 700, fontSize: 18, color: COLORS.danger }}>{fmt(calc.hisTax.total)}</div></div>
                    <div><span style={labelStyle}>Net Annual</span><div style={{ fontWeight: 700, fontSize: 18, color: COLORS.success }}>{fmt(calc.hisNet)}</div></div>
                    <div><span style={labelStyle}>Net Monthly</span><div style={{ fontWeight: 700, fontSize: 18, color: COLORS.success }}>{fmt(calc.hisNet / 12)}</div></div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 8 }}>Effective tax rate: {((calc.hisTax.total / calc.hisGross) * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Partner Income */}
              <div style={cardStyle}>
                <h2 style={{ ...h2Style, color: COLORS.secondary }}>👩 Her Income</h2>
                <CurrencyInput label="Annual Salary" value={partnerSalary} onChange={setPartnerSalary} color={COLORS.secondary} />
                <div style={{ background: `${COLORS.secondary}0D`, borderRadius: 12, padding: 16, marginTop: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><span style={labelStyle}>Gross Annual</span><div style={{ fontWeight: 700, fontSize: 18 }}>{fmt(calc.partnerGross)}</div></div>
                    <div><span style={labelStyle}>Total Tax</span><div style={{ fontWeight: 700, fontSize: 18, color: COLORS.danger }}>{fmt(calc.partnerTax.total)}</div></div>
                    <div><span style={labelStyle}>Net Annual</span><div style={{ fontWeight: 700, fontSize: 18, color: COLORS.success }}>{fmt(calc.partnerNet)}</div></div>
                    <div><span style={labelStyle}>Net Monthly</span><div style={{ fontWeight: 700, fontSize: 18, color: COLORS.success }}>{fmt(calc.partnerNet / 12)}</div></div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 8 }}>Effective tax rate: {((calc.partnerTax.total / calc.partnerGross) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Investment Income */}
            <div style={cardStyle}>
              <h2 style={{ ...h2Style, color: "#5BAE9F" }}>📈 Investment & Portfolio Income</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <CurrencyInput label="Investment Portfolio" value={investmentAssets} onChange={setInvestmentAssets} color="#5BAE9F" />
                  <Slider label="Expected Return" value={investReturnRate} min={1} max={15} step={0.5} onChange={setInvestReturnRate} color="#5BAE9F" format={(v) => v + "%"} />
                  <div style={{ marginTop: 8, padding: 12, background: `${COLORS.accent1}0D`, borderRadius: 10, fontSize: 13, color: COLORS.textLight }}>
                    Household draw is set on the Overview tab. Currently drawing {fmt(monthlyInvestDraw)}/mo after tax.
                  </div>
                </div>
                <div style={{ background: `${COLORS.accent1}0D`, borderRadius: 12, padding: 20 }}>
                  <div style={{ marginBottom: 12 }}><span style={labelStyle}>Total Annual Return</span><div style={{ fontWeight: 700, fontSize: 20 }}>{fmt(calc.totalInvestReturn)}</div></div>
                  <div style={{ marginBottom: 12 }}><span style={labelStyle}>Pre-Tax Draw</span><div style={{ fontWeight: 700, fontSize: 20, color: COLORS.warning }}>{fmt(calc.investDrawPreTax)}</div></div>
                  <div style={{ marginBottom: 12 }}><span style={labelStyle}>Taxes on Draw</span><div style={{ fontWeight: 700, fontSize: 20, color: COLORS.danger }}>{fmt(calc.investTax.total)}</div></div>
                  <div style={{ marginBottom: 12 }}><span style={labelStyle}>After-Tax Draw (to Household)</span><div style={{ fontWeight: 700, fontSize: 20, color: COLORS.success }}>{fmt(calc.investIncomeAfterTax)}/yr</div></div>
                  <div style={{ paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}><span style={labelStyle}>Reinvested (Growing Portfolio)</span><div style={{ fontWeight: 700, fontSize: 20, color: COLORS.primary }}>{fmt(calc.reinvested)}/yr</div></div>
                </div>
              </div>
            </div>

            {/* Tax Comparison Chart */}
            <div style={cardStyle}>
              <h2 style={h2Style}>Annual Tax Breakdown Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taxComparison}>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={fmtK} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Federal" fill={PIE_COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NY State" fill={PIE_COLORS[1]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="NYC Local" fill={PIE_COLORS[2]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="FICA" fill={PIE_COLORS[3]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══ PRIMARY HOME TAB ═══ */}
        {tab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Inputs */}
              <div style={cardStyle}>
                <h2 style={h2Style}>🏠 Home Search Parameters</h2>
                <CurrencyInput label="Home Price" value={homePrice} onChange={setHomePrice} color={COLORS.primary} />
                <CurrencyInput label="Down Payment" value={downPayment} onChange={setDownPayment} color={COLORS.accent1} />
                <CurrencyInput label="Monthly Taxes" value={monthlyTaxes} onChange={setMonthlyTaxes} color={COLORS.accent2} />
                <CurrencyInput label="Monthly HOA Fees" value={monthlyHOA} onChange={setMonthlyHOA} color={COLORS.accent3} />
                <Slider label="Financing Rate (Interest Only)" value={mortgageRate} min={3} max={10} step={0.125} onChange={setMortgageRate} format={(v) => v.toFixed(2) + "%"} color={COLORS.secondary} />

                {/* Quick info */}
                <div style={{ marginTop: 8, padding: 14, background: `${COLORS.primary}08`, borderRadius: 10, fontSize: 13, color: COLORS.textLight }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>Financed Amount</span>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{fmt(calc.loanAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Down Payment %</span>
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{homePrice > 0 ? ((downPayment / homePrice) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </div>

              {/* Right: Monthly Cost Breakdown + Summary */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Monthly Cost Breakdown */}
                <div style={cardStyle}>
                  <h2 style={h2Style}>Monthly Estimated Cost</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Financing Cost", val: calc.monthlyMortgage, color: COLORS.primary, sub: `${fmt(calc.loanAmount)} @ ${mortgageRate}% interest only` },
                      { label: "Property Tax", val: calc.monthlyPropertyTax, color: COLORS.accent2, sub: `${fmt(monthlyTaxes * 12)}/year` },
                      { label: "HOA Fees", val: monthlyHOA, color: COLORS.accent3, sub: "Monthly dues" },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: "14px 18px", background: `${item.color}0D`, borderRadius: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600 }}>{item.label}</span>
                          <span style={{ fontWeight: 700, fontSize: 18, color: item.color }}>{fmt(item.val)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>{item.sub}</div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px", background: `linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.secondary}15)`, borderRadius: 12, borderTop: `2px solid ${COLORS.primary}` }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>Total Monthly Housing</span>
                      <span style={{ fontWeight: 800, fontSize: 26, color: COLORS.primary }}>{fmt(calc.totalMonthlyHousing)}</span>
                    </div>
                  </div>
                </div>

                {/* Summary: Income → Housing → Net */}
                <div style={cardStyle}>
                  <h2 style={h2Style}>Monthly Summary</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {/* Monthly Income */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Monthly Income</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Combined take-home + investment draw</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 22, color: COLORS.success }}>{fmt(calc.totalMonthlyIncome)}</span>
                    </div>

                    {/* Monthly Housing */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Monthly Housing Costs</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Financing + Taxes + HOA</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 22, color: COLORS.danger }}>-{fmt(calc.totalMonthlyHousing)}</span>
                    </div>

                    {/* Net for Other Purposes */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>Net Income for Other Purposes</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>What's left for living, savings, fun</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 26, color: (calc.totalMonthlyIncome - calc.totalMonthlyHousing) >= 0 ? COLORS.primary : COLORS.danger }}>
                        {fmt(calc.totalMonthlyIncome - calc.totalMonthlyHousing)}
                      </span>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min((calc.totalMonthlyHousing / calc.totalMonthlyIncome) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600, color: "#fff", transition: "width 0.5s",
                      }}>
                        Housing {((calc.totalMonthlyHousing / calc.totalMonthlyIncome) * 100).toFixed(0)}%
                      </div>
                      <div style={{
                        flex: 1, background: COLORS.success + "33",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600, color: COLORS.success,
                      }}>
                        Available {Math.max(0, 100 - (calc.totalMonthlyHousing / calc.totalMonthlyIncome) * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 6, textAlign: "center" }}>
                      {calc.totalMonthlyHousing / calc.totalMonthlyIncome > 0.3
                        ? "Housing exceeds the 30% guideline — consider adjusting"
                        : "Housing is within the recommended 30% guideline"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CHILDREN TAB ═══ */}
        {tab === "children" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Inputs */}
              <div style={cardStyle}>
                <h2 style={h2Style}>👶 Children Costs</h2>
                <CurrencyInput label="Nanny (monthly)" value={nannyMonthly} onChange={setNannyMonthly} color={COLORS.secondary} />
                <CurrencyInput label="Day Care (monthly)" value={dayCareMonthly} onChange={setDayCareMonthly} color={COLORS.accent3} />
                <CurrencyInput label="Private School (annual tuition)" value={privateSchoolAnnual} onChange={setPrivateSchoolAnnual} color={COLORS.primary} />

                {privateSchoolAnnual > 0 && (
                  <div style={{ marginTop: -8, marginBottom: 16, fontSize: 12, color: COLORS.textLight, paddingLeft: 2 }}>
                    = {fmt(privateSchoolAnnual / 12)}/month
                  </div>
                )}

                <div style={{ marginTop: 8, padding: 16, background: `linear-gradient(135deg, ${COLORS.secondary}10, ${COLORS.accent3}10)`, borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>Total Monthly Children Costs</span>
                    <span style={{ fontWeight: 800, fontSize: 24, color: COLORS.secondary }}>{fmt(calc.monthlyChildren)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}>
                    {fmt(calc.monthlyChildren * 12)}/year
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div style={cardStyle}>
                <h2 style={h2Style}>Monthly Summary</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {/* Monthly Income */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Monthly Income</div>
                      <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Combined take-home + investment draw</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 22, color: COLORS.success }}>{fmt(calc.totalMonthlyIncome)}</span>
                  </div>

                  {/* Housing */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Housing Costs</div>
                      <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Financing + Taxes + HOA</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 22, color: COLORS.danger }}>-{fmt(calc.totalMonthlyHousing)}</span>
                  </div>

                  {/* Children */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Children Costs</div>
                      <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
                        {[nannyMonthly > 0 && "Nanny", dayCareMonthly > 0 && "Day Care", privateSchoolAnnual > 0 && "Private School"].filter(Boolean).join(" + ") || "None set"}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 22, color: calc.monthlyChildren > 0 ? COLORS.danger : COLORS.textLight }}>
                      {calc.monthlyChildren > 0 ? `-${fmt(calc.monthlyChildren)}` : fmt(0)}
                    </span>
                  </div>

                  {/* Net for Other Purposes */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>Net Income for Other Purposes</div>
                      <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>What's left for living, savings, fun</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 26, color: (calc.totalMonthlyIncome - calc.totalMonthlyHousing - calc.monthlyChildren) >= 0 ? COLORS.primary : COLORS.danger }}>
                      {fmt(calc.totalMonthlyIncome - calc.totalMonthlyHousing - calc.monthlyChildren)}
                    </span>
                  </div>
                </div>

                {/* Visual bar */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min((calc.totalMonthlyHousing / calc.totalMonthlyIncome) * 100, 100)}%`,
                      background: COLORS.primary,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 600, color: "#fff", transition: "width 0.5s",
                    }}>
                      {(calc.totalMonthlyHousing / calc.totalMonthlyIncome) * 100 > 8 && `Housing ${((calc.totalMonthlyHousing / calc.totalMonthlyIncome) * 100).toFixed(0)}%`}
                    </div>
                    {calc.monthlyChildren > 0 && (
                      <div style={{
                        width: `${Math.min((calc.monthlyChildren / calc.totalMonthlyIncome) * 100, 100)}%`,
                        background: COLORS.secondary,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 600, color: "#fff", transition: "width 0.5s",
                      }}>
                        {(calc.monthlyChildren / calc.totalMonthlyIncome) * 100 > 8 && `Children ${((calc.monthlyChildren / calc.totalMonthlyIncome) * 100).toFixed(0)}%`}
                      </div>
                    )}
                    <div style={{
                      flex: 1, background: COLORS.success + "33",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 600, color: COLORS.success,
                    }}>
                      Available {Math.max(0, 100 - ((calc.totalMonthlyHousing + calc.monthlyChildren) / calc.totalMonthlyIncome) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.primary }} /> Housing
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.secondary }} /> Children
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS.success + "33" }} /> Available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ LIVING EXPENSES TAB ═══ */}
        {tab === "living" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Inputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Annual Section */}
                <div style={cardStyle}>
                  <h2 style={h2Style}>📅 Annual Expenses</h2>
                  <CurrencyInput label="Club Memberships (annual)" value={clubMemberships} onChange={setClubMemberships} color={COLORS.accent3} />
                  {clubMemberships > 0 && (
                    <div style={{ marginTop: -10, marginBottom: 16, fontSize: 12, color: COLORS.textLight, paddingLeft: 2 }}>
                      = {fmt(clubMemberships / 12)}/month
                    </div>
                  )}
                  <CurrencyInput label="Other Annual (annual)" value={annualOther} onChange={setAnnualOther} color={COLORS.accent2} />
                  {annualOther > 0 && (
                    <div style={{ marginTop: -10, marginBottom: 16, fontSize: 12, color: COLORS.textLight, paddingLeft: 2 }}>
                      = {fmt(annualOther / 12)}/month
                    </div>
                  )}
                  <div style={{ padding: 12, background: `${COLORS.accent3}0D`, borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={labelStyle}>Total Annual</span>
                      <span style={{ fontWeight: 700, color: COLORS.accent3 }}>{fmt(calc.annualLiving)}/yr ({fmt(calc.annualLiving / 12)}/mo)</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Section */}
                <div style={cardStyle}>
                  <h2 style={h2Style}>🗓️ Monthly Expenses</h2>
                  <CurrencyInput label="Health / Fitness" value={healthFitness} onChange={setHealthFitness} color={COLORS.success} />
                  <CurrencyInput label="Food and Dining" value={foodDining} onChange={setFoodDining} color={COLORS.secondary} />
                  <CurrencyInput label="Other Monthly" value={monthlyOther} onChange={setMonthlyOther} color={COLORS.accent2} />
                  <div style={{ padding: 12, background: `${COLORS.secondary}0D`, borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={labelStyle}>Total Monthly Direct</span>
                      <span style={{ fontWeight: 700, color: COLORS.secondary }}>{fmt(calc.monthlyLivingDirect)}/mo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Total Living Cost */}
                <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${COLORS.accent3}08, ${COLORS.secondary}08)` }}>
                  <h2 style={h2Style}>Total Living Expenses</h2>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 28, color: COLORS.text }}>{fmt(calc.monthlyLiving)}<span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textLight }}>/mo</span></div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 20, color: COLORS.textLight }}>{fmt(calc.monthlyLiving * 12)}/yr</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textLight }}>
                    {((calc.monthlyLiving / calc.totalMonthlyIncome) * 100).toFixed(1)}% of household income
                  </div>
                </div>

                {/* Waterfall Summary */}
                <div style={cardStyle}>
                  <h2 style={h2Style}>Monthly Summary</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {/* Net Income */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Monthly Income</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Combined take-home + investment draw</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 22, color: COLORS.success }}>{fmt(calc.totalMonthlyIncome)}</span>
                    </div>

                    {/* Minus Home */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Housing Costs</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Financing + Taxes + HOA</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 22, color: COLORS.danger }}>-{fmt(calc.totalMonthlyHousing)}</span>
                    </div>

                    {/* Minus Children */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Children Costs</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Nanny, Day Care, School</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 22, color: calc.monthlyChildren > 0 ? COLORS.danger : COLORS.textLight }}>
                        {calc.monthlyChildren > 0 ? `-${fmt(calc.monthlyChildren)}` : fmt(0)}
                      </span>
                    </div>

                    {/* Minus Living */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.text }}>Living Expenses</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Health, Food, Clubs, Other</div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 22, color: calc.monthlyLiving > 0 ? COLORS.danger : COLORS.textLight }}>
                        {calc.monthlyLiving > 0 ? `-${fmt(calc.monthlyLiving)}` : fmt(0)}
                      </span>
                    </div>

                    {/* Left Over for Savings */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.text }}>Left Over for Savings</div>
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>Before big purchases & vacations</div>
                      </div>
                      {(() => {
                        const leftOver = calc.totalMonthlyIncome - calc.totalMonthlyHousing - calc.monthlyChildren - calc.monthlyLiving;
                        return (
                          <span style={{ fontWeight: 800, fontSize: 26, color: leftOver >= 0 ? COLORS.success : COLORS.danger }}>
                            {fmt(leftOver)}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden" }}>
                      {[
                        { label: "Housing", val: calc.totalMonthlyHousing, color: COLORS.primary },
                        { label: "Children", val: calc.monthlyChildren, color: COLORS.secondary },
                        { label: "Living", val: calc.monthlyLiving, color: COLORS.accent3 },
                        { label: "Savings", val: Math.max(0, calc.totalMonthlyIncome - calc.totalMonthlyHousing - calc.monthlyChildren - calc.monthlyLiving), color: COLORS.success + "55" },
                      ].filter(s => s.val > 0).map((seg) => {
                        const pct = (seg.val / calc.totalMonthlyIncome) * 100;
                        return (
                          <div key={seg.label} style={{
                            width: `${Math.min(pct, 100)}%`, background: seg.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 600, color: seg.label === "Savings" ? COLORS.success : "#fff",
                            transition: "width 0.5s",
                          }}>
                            {pct > 8 && `${seg.label} ${pct.toFixed(0)}%`}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 8, justifyContent: "center", fontSize: 12 }}>
                      {[
                        { label: "Housing", color: COLORS.primary },
                        { label: "Children", color: COLORS.secondary },
                        { label: "Living", color: COLORS.accent3 },
                        { label: "Savings", color: COLORS.success },
                      ].map((l) => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} /> {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SAVINGS & GOALS TAB ═══ */}
        {tab === "goals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left: Fund Setup */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={cardStyle}>
                  <h2 style={h2Style}>🎯 Big Purchase Fund</h2>
                  <CurrencyInput label="Current Fund Balance" value={currentFundBalance} onChange={setCurrentFundBalance} color={COLORS.success} />
                  <Slider
                    label="Monthly Contribution to Fund"
                    value={monthlyFundContrib}
                    min={0}
                    max={Math.max(1000, Math.round(calc.leftOverBeforeFund))}
                    step={250}
                    onChange={setMonthlyFundContrib}
                    color={COLORS.accent3}
                  />
                  <div style={{ padding: 12, background: `${COLORS.success}0D`, borderRadius: 10, marginTop: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={labelStyle}>Available (after expenses)</span>
                      <span style={{ fontWeight: 600, color: calc.leftOverBeforeFund >= 0 ? COLORS.success : COLORS.danger }}>{fmt(calc.leftOverBeforeFund)}/mo</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={labelStyle}>Contributing to Fund</span>
                      <span style={{ fontWeight: 700, color: COLORS.accent3 }}>{fmt(monthlyFundContrib)}/mo</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>
                      <span style={labelStyle}>Remaining Surplus</span>
                      <span style={{ fontWeight: 700, color: calc.monthlySurplus >= 0 ? COLORS.success : COLORS.danger }}>{fmt(calc.monthlySurplus)}/mo</span>
                    </div>
                  </div>
                </div>

                {/* Fund Growth Preview */}
                <div style={cardStyle}>
                  <h2 style={h2Style}>Fund Growth Preview</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[3, 6, 12, 24].map((m) => {
                      const futureBalance = currentFundBalance + (monthlyFundContrib * m);
                      return (
                        <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: `${COLORS.accent3}08`, borderRadius: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>In {m} months</span>
                          <span style={{ fontWeight: 700, color: COLORS.accent3 }}>{fmt(futureBalance)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: Purchase Queue */}
              <div style={cardStyle}>
                <h2 style={h2Style}>🛒 Purchase Queue</h2>

                {/* Add Item Form */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    style={{
                      flex: 2, padding: "10px 14px", fontSize: 14, border: `1.5px solid ${COLORS.border}`,
                      borderRadius: 8, outline: "none", color: COLORS.text, background: "#FAFBFE",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Cost"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value.replace(/[^0-9]/g, ""))}
                    style={{
                      flex: 1, padding: "10px 14px", fontSize: 14, border: `1.5px solid ${COLORS.border}`,
                      borderRadius: 8, outline: "none", color: COLORS.text, background: "#FAFBFE",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newItemName && newItemCost) {
                        setPurchaseQueue([...purchaseQueue, { id: Date.now(), name: newItemName, cost: Number(newItemCost) }]);
                        setNewItemName("");
                        setNewItemCost("");
                      }
                    }}
                    style={{
                      padding: "10px 18px", border: "none", borderRadius: 8, cursor: "pointer",
                      background: COLORS.primary, color: "#fff", fontWeight: 600, fontSize: 14,
                      opacity: (newItemName && newItemCost) ? 1 : 0.5,
                    }}
                  >
                    Add
                  </button>
                </div>

                {/* Queue Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(() => {
                    let runningCost = 0;
                    return purchaseQueue.map((item, idx) => {
                      const costBefore = runningCost;
                      runningCost += item.cost;

                      const remainingAfterPrior = currentFundBalance - costBefore;
                      const canBuyNow = remainingAfterPrior >= item.cost;
                      const shortfall = canBuyNow ? 0 : item.cost - Math.max(0, remainingAfterPrior);
                      const monthsToSave = monthlyFundContrib > 0 ? Math.ceil(shortfall / monthlyFundContrib) : Infinity;
                      const yearsToSave = Math.floor(monthsToSave / 12);
                      const moRemainder = monthsToSave % 12;

                      return (
                        <div key={item.id} style={{
                          padding: "14px 16px", borderRadius: 12,
                          background: canBuyNow ? `${COLORS.success}0D` : `${COLORS.accent2}0D`,
                          border: `1px solid ${canBuyNow ? COLORS.success + "33" : COLORS.border}`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 13, color: COLORS.textLight, fontWeight: 600, width: 24 }}>#{idx + 1}</span>
                              <span style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontWeight: 700, fontSize: 17, color: COLORS.text }}>{fmt(item.cost)}</span>
                              <button
                                onClick={() => setPurchaseQueue(purchaseQueue.filter(q => q.id !== item.id))}
                                style={{
                                  background: "none", border: "none", cursor: "pointer",
                                  fontSize: 16, color: COLORS.textLight, padding: "2px 6px", borderRadius: 4,
                                }}
                              >
                                x
                              </button>
                            </div>
                          </div>
                          <div style={{ marginTop: 8, fontSize: 13 }}>
                            {canBuyNow ? (
                              <span style={{ color: COLORS.success, fontWeight: 600 }}>
                                Can purchase now from fund ({fmt(remainingAfterPrior)} available after prior items)
                              </span>
                            ) : (
                              <span style={{ color: COLORS.warning, fontWeight: 500 }}>
                                Need {fmt(shortfall)} more
                                {monthlyFundContrib > 0
                                  ? ` — ${yearsToSave > 0 ? `${yearsToSave}y ` : ""}${moRemainder}mo to save`
                                  : " — set a monthly contribution to save"
                                }
                              </span>
                            )}
                          </div>
                          {/* Move buttons */}
                          <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                            {idx > 0 && (
                              <button onClick={() => {
                                const newQ = [...purchaseQueue];
                                [newQ[idx - 1], newQ[idx]] = [newQ[idx], newQ[idx - 1]];
                                setPurchaseQueue(newQ);
                              }} style={{ fontSize: 11, padding: "2px 8px", border: `1px solid ${COLORS.border}`, borderRadius: 4, background: "#fff", cursor: "pointer", color: COLORS.textLight }}>
                                Move up
                              </button>
                            )}
                            {idx < purchaseQueue.length - 1 && (
                              <button onClick={() => {
                                const newQ = [...purchaseQueue];
                                [newQ[idx], newQ[idx + 1]] = [newQ[idx + 1], newQ[idx]];
                                setPurchaseQueue(newQ);
                              }} style={{ fontSize: 11, padding: "2px 8px", border: `1px solid ${COLORS.border}`, borderRadius: 4, background: "#fff", cursor: "pointer", color: COLORS.textLight }}>
                                Move down
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {purchaseQueue.length === 0 && (
                    <div style={{ padding: 24, textAlign: "center", color: COLORS.textLight, fontSize: 14 }}>
                      Add items to your purchase queue to plan ahead
                    </div>
                  )}
                </div>

                {/* Queue Total */}
                {purchaseQueue.length > 0 && (
                  <div style={{ marginTop: 16, padding: 14, background: `linear-gradient(135deg, ${COLORS.primary}08, ${COLORS.accent3}08)`, borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={labelStyle}>Total Queue Cost</span>
                      <span style={{ fontWeight: 700, color: COLORS.text }}>{fmt(purchaseQueue.reduce((s, i) => s + i.cost, 0))}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={labelStyle}>Current Fund</span>
                      <span style={{ fontWeight: 700, color: COLORS.success }}>{fmt(currentFundBalance)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>
                      <span style={labelStyle}>Shortfall</span>
                      {(() => {
                        const totalQ = purchaseQueue.reduce((s, i) => s + i.cost, 0);
                        const short = Math.max(0, totalQ - currentFundBalance);
                        const moAll = monthlyFundContrib > 0 ? Math.ceil(short / monthlyFundContrib) : 0;
                        return (
                          <span style={{ fontWeight: 700, color: short > 0 ? COLORS.warning : COLORS.success }}>
                            {short > 0 ? `${fmt(short)} (${Math.floor(moAll/12) > 0 ? Math.floor(moAll/12) + "y " : ""}${moAll%12}mo)` : "Fully funded!"}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ MONEY FLOW TAB ═══ */}
        {tab === "flow" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={cardStyle}>
              <h2 style={h2Style}>Where Every Dollar Goes (Monthly)</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={whereItGoes} layout="vertical">
                  <XAxis type="number" tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {whereItGoes.map((_, i) => (
                      <Cell key={i} fill={i < 4 ? COLORS.danger + "CC" : i === whereItGoes.length - 1 ? COLORS.success : PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Side by side: Who Earns vs Who Spends */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={cardStyle}>
                <h2 style={h2Style}>Income Contribution</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "His Contribution", amount: calc.hisMonthlyContrib * 12, color: COLORS.primary },
                    { label: "Her Contribution", amount: calc.partnerMonthlyContrib * 12, color: COLORS.secondary },
                    { label: "Investment Draw", amount: calc.investIncomeAfterTax, color: COLORS.accent1 },
                  ].map((item) => {
                    const totalIncome = calc.hisMonthlyContrib * 12 + calc.partnerMonthlyContrib * 12 + calc.investIncomeAfterTax;
                    const pct = (item.amount / totalIncome) * 100;
                    return (
                      <div key={item.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                          <span style={{ fontSize: 13, color: item.color, fontWeight: 600 }}>{fmt(item.amount/12)}/mo ({pct.toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: 20, background: COLORS.border, borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: item.color, borderRadius: 10, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={cardStyle}>
                <h2 style={h2Style}>Annual Summary</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Total Gross Income", val: calc.combinedGross, color: COLORS.text },
                    { label: "Total Taxes Paid", val: calc.hisTax.total + calc.partnerTax.total, color: COLORS.danger },
                    { label: "Total Net Income", val: calc.combinedNet, color: COLORS.success },
                    { label: "Investment Income (after tax)", val: calc.investIncomeAfterTax, color: COLORS.accent1 },
                    { label: "Total Spending", val: calc.totalMonthlySpending * 12, color: COLORS.warning },
                    { label: "Annual Surplus", val: calc.monthlySurplus * 12, color: surplusColor },
                    { label: "Portfolio Growth (reinvested)", val: calc.reinvested, color: COLORS.primary },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <span style={{ fontSize: 14 }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.color }}>{fmt(item.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lifestyle Balance Meter */}
            <div style={cardStyle}>
              <h2 style={h2Style}>Lifestyle Balance</h2>
              <div style={{ display: "flex", height: 50, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                {[
                  { label: "Taxes", pct: ((calc.hisTax.total + calc.partnerTax.total) / 12) / (calc.combinedGross / 12 + calc.investIncomeMonthlyAfterTax) * 100, color: "#F5A0A0" },
                  { label: "Housing", pct: calc.totalMonthlyHousing / (calc.combinedGross / 12 + calc.investIncomeMonthlyAfterTax) * 100, color: "#7C9FE3" },
                  { label: "Living", pct: calc.monthlyLiving / (calc.combinedGross / 12 + calc.investIncomeMonthlyAfterTax) * 100, color: "#E8A0BF" },
                  { label: "Fund", pct: monthlyFundContrib / (calc.combinedGross / 12 + calc.investIncomeMonthlyAfterTax) * 100, color: "#F5D5A0" },
                  { label: "Savings", pct: Math.max(0, calc.monthlySurplus) / (calc.combinedGross / 12 + calc.investIncomeMonthlyAfterTax) * 100, color: "#7DCFB6" },
                ].map((seg) => (
                  <div key={seg.label} style={{ width: `${seg.pct}%`, background: seg.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff", minWidth: seg.pct > 3 ? 40 : 0, transition: "width 0.5s" }}>
                    {seg.pct > 5 && `${seg.label} ${seg.pct.toFixed(0)}%`}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                {[
                  { label: "Taxes", color: "#F5A0A0" },
                  { label: "Housing", color: "#7C9FE3" },
                  { label: "Living", color: "#E8A0BF" },
                  { label: "Fun & Goals", color: "#F5D5A0" },
                  { label: "Savings", color: "#7DCFB6" },
                ].map((l) => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
