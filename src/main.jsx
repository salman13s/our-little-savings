import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Heart, LockKeyhole, Plus, ArrowDownLeft, CalendarDays, LogOut, Pencil, Trash2, X, Eye, EyeOff, Mail, UserRound, Check, Ban, Image as ImageIcon } from "lucide-react";
import "./style.css";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && anon ? createClient(url, anon) : null;
const welcomeImageUrl = `${import.meta.env.BASE_URL}welcome-landscape.png`;
const money = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n || 0));
const dateLabel = d => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function App() {
  const [rows, setRows] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestName, setRequestName] = useState("");
  const [requests, setRequests] = useState([]);
  const [busyRequest, setBusyRequest] = useState("");
  const [form, setForm] = useState({ amount: "", deposit_date: new Date().toISOString().slice(0,10), note: "" });

  const isAdmin = Boolean(session?.user?.app_metadata?.role === "admin");
  const total = useMemo(() => rows.reduce((sum, row) => sum + Number(row.amount), 0), [rows]);

  async function loadRows() {
    if (!supabase || !session) { setRows([]); setLoading(false); return; }
    setLoading(true); setError("");
    const { data, error } = await supabase.from("deposits").select("*").order("deposit_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) setError(error.message); else setRows(data || []);
    setLoading(false);
  }

  async function callAccessFunction(payload) {
    const { data, error } = await supabase.functions.invoke("access-request", { body: payload });
    if (error) throw new Error(error.message || "The request could not be completed.");
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function loadRequests() {
    if (!isAdmin) return;
    try { const result = await callAccessFunction({ action: "list" }); setRequests(result.requests || []); }
    catch (e) { setError(`Could not load access requests: ${e.message}`); }
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { loadRows(); }, [session]);
  useEffect(() => { if (isAdmin) loadRequests(); else setRequests([]); }, [session]);

  async function signIn(e) {
    e.preventDefault(); setError(""); setNotice("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("We couldn't sign you in. Check your email and password.");
    else { setPassword(""); }
  }

  async function submitAccessRequest(e) {
    e.preventDefault(); setError(""); setNotice("");
    try {
      await callAccessFunction({ action: "request", email: requestEmail.trim(), name: requestName.trim() });
      setNotice("Your request has been sent. The administrator will review it.");
      setRequestEmail(""); setRequestName(""); setShowRequest(false);
    } catch (e) { setError(e.message); }
  }

  async function decideRequest(request, decision) {
    const label = `${decision}:${request.id}`; setBusyRequest(label); setError(""); setNotice("");
    try {
      const result = await callAccessFunction({ action: decision, request_id: request.id });
      setNotice(decision === "approve" ? `Request from ${request.email} approved. Create their account manually in Supabase.` : `Request from ${request.email} declined.`);
      await loadRequests();
    } catch (e) { setError(e.message); }
    finally { setBusyRequest(""); }
  }

  async function signOut() { await supabase.auth.signOut(); setRows([]); setRequests([]); setSelected(null); }
  function startAdd() { setEditing(null); setForm({ amount: "", deposit_date: new Date().toISOString().slice(0,10), note: "" }); }
  function startEdit(row) { setEditing(row); setForm({ amount: String(row.amount), deposit_date: row.deposit_date, note: row.note || "" }); }

  async function saveDeposit(e) {
    e.preventDefault(); setError("");
    const payload = { amount: Number(form.amount), deposit_date: form.deposit_date, note: form.note.trim() || null };
    const result = editing ? await supabase.from("deposits").update(payload).eq("id", editing.id) : await supabase.from("deposits").insert(payload);
    if (result.error) { setError(result.error.message); return; }
    setEditing(null); startAdd(); await loadRows();
  }
  async function deleteDeposit(row) {
    if (!confirm(`Delete the ${money(row.amount)} deposit from ${dateLabel(row.deposit_date)}?`)) return;
    const { error } = await supabase.from("deposits").delete().eq("id", row.id);
    if (error) setError(error.message); else { setSelected(null); await loadRows(); }
  }

  if (!supabase) return <SetupScreen />;

  if (!session) return <main className="welcome-page">
    <div className="welcome-image" style={{ backgroundImage: `url("${welcomeImageUrl}")` }} />
    <div className="welcome-shade" />
    <section className="welcome-card">
      <div className="welcome-mark"><ImageIcon size={25}/></div>
      <div className="welcome-kicker">A PRIVATE SPACE</div>
      <h1>Welcome</h1>
      <p className="welcome-copy">Please sign in to continue.</p>
      {error && <div className="error-box">{error}</div>}
      {notice && <div className="success-box">{notice}</div>}
      <form className="welcome-form" onSubmit={signIn}>
        <label>Email address<div className="input-icon"><Mail size={17}/><input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"/></div></label>
        <label>Password<div className="input-icon"><LockKeyhole size={17}/><input type={showPassword?"text":"password"} required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/><button type="button" className="reveal-button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        <button className="welcome-submit" type="submit">Sign in</button>
      </form>
      <button className="request-link" onClick={()=>{setError("");setNotice("");setShowRequest(true);}}>Request access</button>
      <div className="welcome-foot">Private access · Invitation required</div>
    </section>
    {showRequest && <div className="modal-backdrop" onClick={()=>setShowRequest(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <button className="modal-close" onClick={()=>setShowRequest(false)}><X size={18}/></button>
      <div className="modal-icon"><UserRound size={20}/></div><h2>Request access</h2><p>Send an access request to the site administrator.</p>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={submitAccessRequest}>
        <label>Your name<input required maxLength={80} value={requestName} onChange={e=>setRequestName(e.target.value)} placeholder="Your name"/></label>
        <label>Email address<input type="email" required maxLength={254} value={requestEmail} onChange={e=>setRequestEmail(e.target.value)} placeholder="you@example.com"/></label>
        <button className="primary-button full" type="submit">Send request</button>
      </form>
    </div></div>}
  </main>;

  return <main className="page-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Heart size={17} fill="currentColor"/></span><span>our little savings</span></a>
      <div className="top-actions">{isAdmin && <span className="admin-pill">Admin</span>}<button className="icon-button" title="Sign out" onClick={signOut}><LogOut size={17}/></button></div>
    </header>
    <section className="hero"><div className="eyebrow">A LITTLE SOMETHING FOR US</div><h1>Our little <em>by-and-by.</em></h1><p className="intro">Every little bit, saved with love. A place to watch something special grow, one addition at a time.</p>
      <div className="balance-card"><div className="balance-top"><span>Total saved so far</span><Heart size={20}/></div><div className="balance-amount">{money(total)}</div><div className="balance-bottom"><span>{rows.length} {rows.length === 1 ? "addition" : "additions"}</span><span>{rows.length ? `Since ${dateLabel(rows.reduce((a,b) => a.deposit_date < b.deposit_date ? a : b).deposit_date)}` : "A new beginning"}</span></div><div className="ornament">♡</div></div>
    </section>
    {isAdmin && <section className="requests-panel"><div className="section-heading"><div><div className="eyebrow muted">SITE ACCESS</div><h2>Access requests</h2></div><button className="text-button" onClick={loadRequests}>Refresh</button></div>
      {requests.length === 0 ? <p className="request-empty">No pending access requests.</p> : <div className="request-list">{requests.map(r=><div className="request-row" key={r.id}><div className="request-person"><strong>{r.name || "Name not provided"}</strong><span>{r.email}</span><small>{new Date(r.created_at).toLocaleString()}</small></div><div className="request-actions">{r.status === "pending" ? <><button className="approve-button" disabled={!!busyRequest} onClick={()=>decideRequest(r,"approve")}><Check size={14}/> Approve</button><button className="decline-button" disabled={!!busyRequest} onClick={()=>decideRequest(r,"decline")}><Ban size={14}/> Decline</button></> : <span className={`request-status ${r.status}`}>{r.status}</span>}</div></div>)}</div>}
    </section>}
    <section className="history-section"><div className="section-heading"><div><div className="eyebrow muted">THE LITTLE MOMENTS</div><h2>Savings history</h2></div>{isAdmin && <button className="primary-button" onClick={startAdd}><Plus size={16}/> Add deposit</button>}</div>
      {isAdmin && <form className="editor-card" onSubmit={saveDeposit}><div className="editor-title">{editing ? "Edit deposit" : "Add a little more"}</div><div className="form-grid"><label>Amount (USD)<input type="number" min="0.01" step="0.01" required placeholder="100.00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label>Date added<input type="date" required value={form.deposit_date} onChange={e=>setForm({...form,deposit_date:e.target.value})}/></label><label className="wide">A note (optional)<input maxLength="180" placeholder="A little extra this month..." value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label></div><div className="editor-actions"><button className="primary-button" type="submit">{editing ? "Save changes" : "Save deposit"}</button><button className="text-button" type="button" onClick={()=>{setEditing(null);startAdd();}}>Cancel</button></div></form>}
      {error && <div className="error-box">{error}</div>}{notice && <div className="success-box">{notice}</div>}
      {loading ? <div className="empty-state">Gathering the little moments…</div> : rows.length === 0 ? <div className="empty-state"><span className="empty-heart">♡</span><h3>The first page is waiting.</h3><p>When the first deposit is added, it will appear here.</p></div> : <div className="deposit-list">{rows.map(row=><article className="deposit-row" key={row.id}><button className="deposit-main" onClick={()=>setSelected(selected?.id === row.id ? null : row)}><span className="deposit-icon"><ArrowDownLeft size={18}/></span><span className="deposit-copy"><strong>{dateLabel(row.deposit_date)}</strong><small>{row.note || "A little added to the savings"}</small></span><span className="deposit-amount">+{money(row.amount)}</span><span className="chevron">{selected?.id === row.id ? "−" : "+"}</span></button>{selected?.id === row.id && <div className="deposit-detail"><div><CalendarDays size={15}/> Added on {dateLabel(row.deposit_date)}</div><p>{row.note || "No note was added for this deposit."}</p>{isAdmin && <div className="row-actions"><button onClick={()=>startEdit(row)}><Pencil size={14}/> Edit</button><button className="danger" onClick={()=>deleteDeposit(row)}><Trash2 size={14}/> Delete</button></div>}</div>}</article>)}</div>}
    </section>
    <footer><Heart size={13} fill="currentColor"/> A little grows into a lot. <span>Made with love</span></footer>
  </main>;
}

function SetupScreen() { return <main className="setup-wrap"><div className="setup-card"><div className="brand-mark big"><Heart fill="currentColor"/></div><div className="eyebrow muted">ONE LITTLE STEP BEFORE WE BEGIN</div><h1>Connect your private space.</h1><p>Add your Supabase project URL and public anon key to a <code>.env</code> file. Follow the setup guide included with this project.</p><p className="setup-note">Never put a Supabase service-role key in this website.</p></div></main>; }
createRoot(document.getElementById("root")).render(<App />);
