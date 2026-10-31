import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Heart, LockKeyhole, Plus, ArrowDownLeft, CalendarDays, LogOut, Pencil, Trash2, X, Sparkles, Eye, EyeOff } from "lucide-react";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && anon ? createClient(url, anon) : null;
const money = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
const dateLabel = d => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function App() {
  const [rows, setRows] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminMode, setAdminMode] = useState(location.hash === "#admin");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({ amount: "", deposit_date: new Date().toISOString().slice(0,10), note: "" });

  const isAdmin = Boolean(session?.user?.app_metadata?.role === "admin");
  const total = useMemo(() => rows.reduce((sum, row) => sum + Number(row.amount), 0), [rows]);

  async function loadRows() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.from("deposits").select("*").order("deposit_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { loadRows(); }, [session]);

  async function signIn(e) {
    e.preventDefault(); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else { setShowLogin(false); setPassword(""); setAdminMode(true); location.hash = "admin"; }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAdminMode(false); location.hash = "";
  }

  function startAdd() {
    setEditing(null);
    setForm({ amount: "", deposit_date: new Date().toISOString().slice(0,10), note: "" });
  }
  function startEdit(row) {
    setEditing(row);
    setForm({ amount: String(row.amount), deposit_date: row.deposit_date, note: row.note || "" });
  }

  async function saveDeposit(e) {
    e.preventDefault(); setError("");
    const payload = { amount: Number(form.amount), deposit_date: form.deposit_date, note: form.note.trim() || null };
    const result = editing
      ? await supabase.from("deposits").update(payload).eq("id", editing.id)
      : await supabase.from("deposits").insert(payload);
    if (result.error) { setError(result.error.message); return; }
    setEditing(null); startAdd(); await loadRows();
  }

  async function deleteDeposit(row) {
    if (!confirm(`Delete the ${money(row.amount)} deposit from ${dateLabel(row.deposit_date)}?`)) return;
    const { error } = await supabase.from("deposits").delete().eq("id", row.id);
    if (error) setError(error.message); else { setSelected(null); await loadRows(); }
  }

  if (!supabase) return <SetupScreen />;
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => { setAdminMode(false); location.hash = ""; }}>
          <span className="brand-mark"><Heart size={17} fill="currentColor"/></span>
          <span>our little savings</span>
        </a>
        <div className="top-actions">
          {isAdmin ? <><span className="admin-pill">Admin</span><button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={17}/></button></>
            : <button className="quiet-link" onClick={() => setShowLogin(true)}>Admin sign in</button>}
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={14}/> A LITTLE SOMETHING FOR US</div>
        <h1>Our little <em>by-and-by.</em></h1>
        <p className="intro">Every little bit, saved with love. A place to watch something special grow, one addition at a time.</p>
        <div className="balance-card">
          <div className="balance-top"><span>Total saved so far</span><Heart size={20}/></div>
          <div className="balance-amount">{money(total)}</div>
          <div className="balance-bottom">
            <span>{rows.length} {rows.length === 1 ? "addition" : "additions"}</span>
            <span>{rows.length ? `Since ${dateLabel(rows.reduce((a,b) => a.deposit_date < b.deposit_date ? a : b).deposit_date)}` : "A new beginning"}</span>
          </div>
          <div className="ornament">♡</div>
        </div>
      </section>

      <section className="history-section">
        <div className="section-heading">
          <div><div className="eyebrow muted">THE LITTLE MOMENTS</div><h2>Savings history</h2></div>
          {isAdmin && <button className="primary-button" onClick={startAdd}><Plus size={16}/> Add deposit</button>}
        </div>

        {isAdmin && <form className="editor-card" onSubmit={saveDeposit}>
          <div className="editor-title">{editing ? "Edit deposit" : "Add a little more"}</div>
          <div className="form-grid">
            <label>Amount (USD)<input type="number" min="0.01" step="0.01" required placeholder="100.00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
            <label>Date added<input type="date" required value={form.deposit_date} onChange={e=>setForm({...form,deposit_date:e.target.value})}/></label>
            <label className="wide">A note (optional)<input maxLength="180" placeholder="A little extra this month..." value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label>
          </div>
          <div className="editor-actions"><button className="primary-button" type="submit">{editing ? "Save changes" : "Save deposit"}</button><button className="text-button" type="button" onClick={()=>{setEditing(null);startAdd();}}>Cancel</button></div>
        </form>}

        {error && <div className="error-box">{error}</div>}
        {loading ? <div className="empty-state">Gathering the little moments…</div> :
          rows.length === 0 ? <div className="empty-state"><span className="empty-heart">♡</span><h3>The first page is waiting.</h3><p>When the first deposit is added, it will appear here.</p></div> :
          <div className="deposit-list">{rows.map((row, i) =>
            <article className="deposit-row" key={row.id}>
              <button className="deposit-main" onClick={()=>setSelected(selected?.id === row.id ? null : row)}>
                <span className="deposit-icon"><ArrowDownLeft size={18}/></span>
                <span className="deposit-copy"><strong>{dateLabel(row.deposit_date)}</strong><small>{row.note || "A little added to the savings"}</small></span>
                <span className="deposit-amount">+{money(row.amount)}</span>
                <span className="chevron">{selected?.id === row.id ? "−" : "+"}</span>
              </button>
              {selected?.id === row.id && <div className="deposit-detail">
                <div><CalendarDays size={15}/> Added on {dateLabel(row.deposit_date)}</div>
                <p>{row.note || "No note was added for this deposit."}</p>
                {isAdmin && <div className="row-actions"><button onClick={()=>startEdit(row)}><Pencil size={14}/> Edit</button><button className="danger" onClick={()=>deleteDeposit(row)}><Trash2 size={14}/> Delete</button></div>}
              </div>}
            </article>
          )}</div>
        }
      </section>

      <footer><Heart size={13} fill="currentColor"/> A little grows into a lot. <span>Made with love</span></footer>

      {showLogin && <div className="modal-backdrop" onClick={()=>setShowLogin(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={()=>setShowLogin(false)}><X size={18}/></button>
        <div className="modal-icon"><LockKeyhole size={20}/></div><h2>Welcome back</h2><p>Sign in to manage the savings.</p>
        <form onSubmit={signIn}><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label>Password<div className="password-field"><input type={showPassword?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
          <button className="primary-button full" type="submit">Sign in</button>
        </form>
      </div></div>}
    </main>
  );
}

function SetupScreen() {
  return <main className="setup-wrap"><div className="setup-card"><div className="brand-mark big"><Heart fill="currentColor"/></div><div className="eyebrow muted">ONE LITTLE STEP BEFORE WE BEGIN</div><h1>Connect your savings space.</h1><p>Add your Supabase project URL and public anon key to a <code>.env</code> file. Follow the setup guide included with this project.</p><p className="setup-note">Your database credentials stay in your own project. Never put a Supabase service-role key in this website.</p></div></main>;
}

createRoot(document.getElementById("root")).render(<App />);