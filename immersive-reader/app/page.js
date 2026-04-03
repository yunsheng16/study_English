'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── built-in dictionary ──────────────────────────────────────────────────────
const DICT = {
  art:{ph:'/ɑːrt/',zh:'艺术；技艺'},acquiring:{ph:'/əˈkwaɪərɪŋ/',zh:'获得；习得'},
  vocabulary:{ph:'/vəˈkæbjʊleri/',zh:'词汇量；词汇'},clearly:{ph:'/ˈklɪərli/',zh:'清晰地'},
  powerfully:{ph:'/ˈpaʊərfəli/',zh:'有力地'},ideas:{ph:'/aɪˈdiːəz/',zh:'想法；观念'},
  physicist:{ph:'/ˈfɪzɪsɪst/',zh:'物理学家'},radical:{ph:'/ˈrædɪkəl/',zh:'激进的；根本的'},
  mastering:{ph:'/ˈmæstərɪŋ/',zh:'掌握；精通'},technique:{ph:'/tekˈniːk/',zh:'技术；技巧'},
  remarkable:{ph:'/rɪˈmɑːrkəbəl/',zh:'卓越的；非凡的'},
  intellectual:{ph:'/ˌɪntəˈlektʃuəl/',zh:'智识的；知识分子'},
  independence:{ph:'/ˌɪndɪˈpendəns/',zh:'独立；自主'},
  complexity:{ph:'/kɒmˈpleksɪti/',zh:'复杂性'},genuinely:{ph:'/ˈdʒenjuɪnli/',zh:'真正地'},
  ambiguity:{ph:'/ˌæmbɪˈɡjuːɪti/',zh:'歧义；模糊性'},
  extraordinary:{ph:'/ɪkˈstrɔːrdəneri/',zh:'非凡的；特别的'},
  uncomfortable:{ph:'/ʌnˈkʌmftəbl/',zh:'不舒适的；令人不安的'},
  confusion:{ph:'/kənˈfjuːʒən/',zh:'困惑；混乱'},
};

const SAMPLE = `The art of reading is, in great part, the art of acquiring a better vocabulary. The more words you know, the more clearly and powerfully you will think, and the more ideas you will invite into your mind.

Dr. Richard Feynman, the Nobel Prize-winning physicist, once argued that you do not really understand something unless you can explain it simply. He developed what is now called the Feynman Technique — a learning method built on the radical idea that teaching others is the surest path to mastering a subject yourself.

The U.S. educational system, for all its flaws, does occasionally produce students of remarkable intellectual independence. These individuals learn not because they must, but because the world, in all its complexity, genuinely fascinates them. They read widely, question deeply, and never mistake familiarity for understanding.

True learning is uncomfortable. It requires admitting what you do not know, sitting with confusion, and resisting the urge to reach for simple answers. But the reward is extraordinary: a mind that can navigate ambiguity, find patterns in chaos, and build understanding from the ground up.`;

// ── helpers ──────────────────────────────────────────────────────────────────
function cleanMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/`(.+?)`/g, '$1');
}

function tokenizeSentences(text) {
  const abbrevs = ['Mr','Mrs','Ms','Dr','Prof','Sr','Jr','vs','etc','U.S','U.K','Ph.D'];
  let t = text;
  abbrevs.forEach(a => { t = t.replace(new RegExp('\\b' + a.replace('.','[.]') + '\\.', 'g'), m => m.replace('.', '\x00')); });
  const raw = t.match(/[^.!?…]+(?:[.!?…]+["')\]]*\s*|$)/g) || [t];
  return raw.map(s => s.replace(/\x00/g, '.').trim()).filter(s => s.length > 3);
}

function tokenizeWords(sentence) {
  return sentence.match(/[a-zA-Z''\-]+|[^a-zA-Z''\-]+/g) || [];
}

function cleanWord(tok) {
  return tok.replace(/[^a-zA-Z']/g, '').toLowerCase();
}

function speakText(text, rate = 1.0) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = rate;
  window.speechSynthesis.speak(u);
}

// ── Tooltip component ─────────────────────────────────────────────────────────
function Tooltip({ data, onClose, onAddToBank, inBank }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!data) return;
    const tip = ref.current;
    if (!tip) return;
    const { rect } = data;
    const tipW = tip.offsetWidth || 230;
    const tipH = tip.offsetHeight || 140;
    let top = rect.top - tipH - 10;
    let left = rect.left + rect.width / 2 - tipW / 2;
    if (top < 60) top = rect.bottom + 10;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  }, [data]);

  if (!data) return null;
  return (
    <div ref={ref} style={{
      position:'fixed', zIndex:9999, background:'#26201a',
      border:'1px solid rgba(255,255,255,0.08)', borderRadius:14,
      padding:'0.7rem 1rem', boxShadow:'0 8px 32px rgba(0,0,0,0.45)',
      minWidth:160, maxWidth:240, pointerEvents:'auto',
      animation:'fadeUp 0.18s ease',
    }}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
        <div>
          <div style={{fontFamily:'var(--body)',fontSize:'1.15rem',color:'#f0e8d8',lineHeight:1.2}}>{data.display}</div>
          <div style={{fontFamily:'var(--ui)',fontSize:'0.72rem',color:'rgba(240,232,216,0.45)',marginTop:2}}>{data.ph || ''}</div>
        </div>
        <button onClick={() => { speakText(data.display, 1.0); }}
          style={{background:'rgba(240,232,216,0.1)',border:'1px solid rgba(240,232,216,0.15)',
            borderRadius:6,padding:'5px 6px',cursor:'pointer',color:'rgba(240,232,216,0.6)',
            display:'flex',alignItems:'center',flexShrink:0,marginTop:2}}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        </button>
      </div>
      <div style={{height:1,background:'rgba(240,232,216,0.1)',margin:'6px 0'}}/>
      <div style={{fontFamily:'var(--ui)',fontSize:'0.82rem',color:'rgba(240,232,216,0.82)',lineHeight:1.5,minHeight:20}}>
        {data.zh || <span style={{color:'rgba(240,232,216,0.35)',fontSize:'0.75rem'}}>查询中…</span>}
      </div>
      <button
        onClick={onAddToBank}
        disabled={inBank}
        style={{
          width:'100%', marginTop:8, fontFamily:'var(--ui)', fontSize:'0.75rem', fontWeight:500,
          background: inBank ? 'rgba(60,180,80,0.15)' : 'rgba(212,160,32,0.18)',
          color: inBank ? '#6dcc80' : '#e8b830',
          border: inBank ? '1px solid rgba(60,180,80,0.25)' : '1px solid rgba(212,160,32,0.3)',
          borderRadius:6, padding:'5px 0', cursor: inBank ? 'default' : 'pointer',
          letterSpacing:'0.02em',
        }}>
        {inBank ? '✓ 已在生词本' : '＋ 加入生词本'}
      </button>
    </div>
  );
}

// ── LoadingDots ───────────────────────────────────────────────────────────────
function Dots() {
  return (
    <span style={{display:'inline-flex',gap:3,verticalAlign:'middle'}}>
      {[0,200,400].map(d => (
        <span key={d} style={{width:4,height:4,background:'var(--ink3)',borderRadius:'50%',
          display:'inline-block',animation:`pulse 1.2s ${d}ms infinite`}}/>
      ))}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState('home'); // 'home' | 'reading'
  const [inputText, setInputText] = useState('');
  const [paragraphs, setParagraphs] = useState([]); // [{sentences:[{id,text,words:[]}]}]
  const [allSentences, setAllSentences] = useState([]);
  const [wordBank, setWordBank] = useState({}); // word -> count
  const [wordCache, setWordCache] = useState({}); // word -> {ph,zh}
  const [tooltip, setTooltip] = useState(null); // {word, display, ph, zh, rect}
  const [sentTrans, setSentTrans] = useState({}); // sentId -> {loading,text}
  const [fullTrans, setFullTrans] = useState(null); // null | {loading,text}
  const [playState, setPlayState] = useState({ playing: false, idx: 0 });
  const [speed, setSpeed] = useState(1.0);
  const playRef = useRef({ playing: false, idx: 0, speed: 1.0 });
  const tooltipTimer = useRef(null);

  // keep playRef in sync
  useEffect(() => { playRef.current.speed = speed; }, [speed]);

  // global click dismiss tooltip
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-tooltip]') && !e.target.closest('[data-tipbox]'))
        setTooltip(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── build content ───────────────────────────────────────────────────────────
  function startReading() {
    if (!inputText.trim()) { alert('请先粘贴英文文章！'); return; }
    const cleaned = cleanMarkdown(inputText.trim());
    const rawParas = cleaned.split(/\n\s*\n/).filter(p => p.trim());
    let sentIdx = 0;
    const built = rawParas.map(para => ({
      sentences: tokenizeSentences(para.trim()).map(sentText => {
        const id = sentIdx++;
        const words = tokenizeWords(sentText).map((tok, ti) => {
          const cw = cleanWord(tok);
          return { tok, cw, isWord: cw.length >= 2 && /[a-zA-Z]/.test(tok), key: `${id}-${ti}` };
        });
        return { id, text: sentText, words };
      })
    }));
    const flat = built.flatMap(p => p.sentences);
    setParagraphs(built);
    setAllSentences(flat);
    setWordBank({});
    setWordCache({});
    setSentTrans({});
    setFullTrans(null);
    setPlayState({ playing: false, idx: 0 });
    playRef.current = { playing: false, idx: 0, speed };
    setScreen('reading');
    // auto-fetch full translation
    fetchFullTranslation(cleaned, flat.length);
  }

  // ── word click ──────────────────────────────────────────────────────────────
  const onWordClick = useCallback((word, displayText, rect) => {
    speakText(displayText, playRef.current.speed);
    clearTimeout(tooltipTimer.current);
    const cached = wordCache[word] || DICT[word] || {};
    setTooltip({ word, display: displayText, ph: cached.ph || '', zh: cached.zh || null, rect });
    if (!cached.zh) fetchLookup(word, displayText);
    tooltipTimer.current = setTimeout(() => setTooltip(null), 8000);
  }, [wordCache]);

  async function fetchLookup(word, displayText) {
    if (wordCache[word]?.zh) return;
    try {
      const res = await fetch('/api/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: displayText }),
      });
      const data = await res.json();
      if (data.ph || data.zh) {
        setWordCache(prev => ({ ...prev, [word]: data }));
        setTooltip(prev => prev?.word === word ? { ...prev, ph: data.ph || prev.ph, zh: data.zh || prev.zh } : prev);
      }
    } catch (e) { console.error(e); }
  }

  function addToBank(word) {
    setWordBank(prev => ({ ...prev, [word]: (prev[word] || 0) + 1 }));
    setTooltip(prev => prev ? { ...prev, inBank: true } : null);
  }

  // ── sentence translation ────────────────────────────────────────────────────
  async function toggleSentTrans(sentId, sentText) {
    if (sentTrans[sentId]?.text) {
      setSentTrans(prev => { const n = {...prev}; delete n[sentId]; return n; });
      return;
    }
    setSentTrans(prev => ({ ...prev, [sentId]: { loading: true, text: null } }));
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentText, mode: 'sentence' }),
      });
      const data = await res.json();
      setSentTrans(prev => ({ ...prev, [sentId]: { loading: false, text: data.result || data.error || '翻译失败' } }));
    } catch (e) {
      setSentTrans(prev => ({ ...prev, [sentId]: { loading: false, text: '翻译失败' } }));
    }
  }

  async function fetchFullTranslation(text) {
    setFullTrans({ loading: true, text: null });
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: 'full' }),
      });
      const data = await res.json();
      setFullTrans({ loading: false, text: data.result || data.error || '翻译失败' });
    } catch (e) {
      setFullTrans({ loading: false, text: '翻译失败' });
    }
  }

  // ── playback ────────────────────────────────────────────────────────────────
  function playFrom(idx) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    playRef.current = { playing: true, idx, speed: playRef.current.speed };
    setPlayState({ playing: true, idx });
    playNext(idx);
  }

  function playNext(idx) {
    if (!playRef.current.playing || idx >= allSentences.length) {
      playRef.current.playing = false;
      setPlayState({ playing: false, idx: 0 });
      window.speechSynthesis.cancel();
      return;
    }
    setPlayState({ playing: true, idx });
    const u = new SpeechSynthesisUtterance(allSentences[idx].text);
    u.lang = 'en-US'; u.rate = playRef.current.speed;
    u.onend = () => {
      if (playRef.current.playing) {
        playRef.current.idx = idx + 1;
        setTimeout(() => playNext(idx + 1), 250);
      }
    };
    window.speechSynthesis.speak(u);
    // scroll
    const el = document.getElementById('sent-' + idx);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function togglePlay() {
    if (playState.playing) {
      window.speechSynthesis.pause();
      playRef.current.playing = false;
      setPlayState(s => ({ ...s, playing: false }));
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        playRef.current.playing = true;
        setPlayState(s => ({ ...s, playing: true }));
      } else {
        playFrom(playState.idx);
      }
    }
  }

  function stopPlay() {
    window.speechSynthesis.cancel();
    playRef.current = { playing: false, idx: 0, speed: playRef.current.speed };
    setPlayState({ playing: false, idx: 0 });
  }

  function changeSpeed(s) {
    setSpeed(s); playRef.current.speed = s;
    if (playState.playing) {
      const was = playRef.current.idx;
      stopPlay();
      setTimeout(() => playFrom(was), 80);
    }
  }

  // ── render home ─────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <main style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      minHeight:'100vh',padding:'2rem 1rem',gap:'1.5rem',background:'var(--paper)',position:'relative',overflow:'hidden'}}>

      {/* bg glow */}
      <div style={{position:'absolute',top:-120,right:-100,width:500,height:500,
        background:'radial-gradient(circle,rgba(168,120,32,0.06) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>

      <div style={{textAlign:'center',animation:'fadeUp 0.6s ease both'}}>
        <h1 style={{fontFamily:'var(--serif)',fontSize:'clamp(2.2rem,5vw,3.6rem)',fontWeight:400,
          lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:'0.5rem'}}>
          精读英文，<em style={{fontStyle:'italic',color:'var(--amber)'}}>听见</em>每个词
        </h1>
        <p style={{fontFamily:'var(--ui)',fontSize:'1rem',color:'var(--ink2)',fontWeight:300}}>
          点击单词听发音 · 悬停句子看翻译 · 跟读高亮跟节奏
        </p>
      </div>

      <div style={{width:'100%',maxWidth:700,background:'white',border:'1px solid var(--paper3)',
        borderRadius:20,padding:'2rem',boxShadow:'var(--shadow)',animation:'fadeUp 0.6s 0.1s ease both'}}>
        <label style={{fontFamily:'var(--ui)',fontSize:'0.78rem',fontWeight:500,letterSpacing:'0.08em',
          textTransform:'uppercase',color:'var(--ink3)',marginBottom:'0.5rem',display:'block'}}>粘贴英文文章</label>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => { if ((e.ctrlKey||e.metaKey) && e.key==='Enter') startReading(); }}
          placeholder={'粘贴任何英文内容——文章、故事、演讲稿、新闻……\n\n支持 Ctrl+Enter 快速开始'}
          style={{width:'100%',minHeight:220,fontFamily:'var(--body)',fontSize:'1.1rem',lineHeight:1.8,
            color:'var(--ink)',background:'var(--paper)',border:'1.5px solid var(--paper3)',
            borderRadius:12,padding:'1rem',resize:'vertical',outline:'none',
            transition:'border-color 0.2s',fontStyle:'normal'}}
          onFocus={e => e.target.style.borderColor='var(--amber)'}
          onBlur={e => e.target.style.borderColor='var(--paper3)'}
        />
        <div style={{display:'flex',gap:'0.75rem',marginTop:'1.25rem',flexWrap:'wrap',alignItems:'center'}}>
          <button onClick={startReading} style={{fontFamily:'var(--ui)',fontSize:'0.95rem',fontWeight:500,
            background:'var(--ink)',color:'var(--paper)',border:'none',borderRadius:50,
            padding:'0.7rem 1.8rem',cursor:'pointer'}}>
            开始学习 →
          </button>
          <button onClick={() => setInputText(SAMPLE)} style={{fontFamily:'var(--ui)',fontSize:'0.88rem',
            background:'transparent',color:'var(--ink2)',border:'1.5px solid var(--paper3)',
            borderRadius:50,padding:'0.65rem 1.4rem',cursor:'pointer'}}>
            加载示例文章
          </button>
          <span style={{fontFamily:'var(--ui)',fontSize:'0.78rem',color:'var(--ink3)',marginLeft:'auto'}}>Ctrl + Enter</span>
        </div>
      </div>

      <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',justifyContent:'center',
        animation:'fadeUp 0.6s 0.2s ease both'}}>
        {['点词听音 + 音标释义','逐句翻译（遮掩学习）','全文朗读 + 高亮跟读','生词本自动收集'].map(f => (
          <span key={f} style={{display:'flex',alignItems:'center',gap:6,fontFamily:'var(--ui)',
            fontSize:'0.8rem',color:'var(--ink3)'}}>
            <span style={{width:6,height:6,background:'var(--amber)',borderRadius:'50%',flexShrink:0}}/>
            {f}
          </span>
        ))}
      </div>
    </main>
  );

  // ── render reading ──────────────────────────────────────────────────────────
  const sortedBank = Object.entries(wordBank).sort((a,b) => b[1]-a[1]);

  return (
    <div style={{minHeight:'100vh',paddingBottom:140}}>

      {/* NAV */}
      <nav style={{position:'sticky',top:0,background:'rgba(250,246,240,0.92)',
        backdropFilter:'blur(12px)',borderBottom:'1px solid var(--paper3)',
        padding:'0.7rem 1.5rem',display:'flex',alignItems:'center',gap:'0.75rem',zIndex:100}}>
        <button onClick={() => { stopPlay(); setScreen('home'); }} style={{
          fontFamily:'var(--ui)',fontSize:'0.8rem',background:'transparent',color:'var(--ink2)',
          border:'1px solid var(--paper3)',borderRadius:6,padding:'0.38rem 0.75rem',cursor:'pointer',
          display:'flex',alignItems:'center',gap:5}}>
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          返回
        </button>
        <span style={{fontFamily:'var(--ui)',fontSize:'0.82rem',color:'var(--ink3)',flex:1,
          textAlign:'center',textTransform:'uppercase',letterSpacing:'0.05em'}}>沉浸式阅读</span>
        <button onClick={() => document.getElementById('word-bank-section')?.scrollIntoView({behavior:'smooth'})}
          style={{fontFamily:'var(--ui)',fontSize:'0.8rem',background:'transparent',color:'var(--ink2)',
            border:'1px solid var(--paper3)',borderRadius:6,padding:'0.38rem 0.75rem',cursor:'pointer',
            display:'flex',alignItems:'center',gap:5}}>
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
          生词本
        </button>
      </nav>

      {/* TEXT BODY */}
      <div style={{maxWidth:740,margin:'0 auto',padding:'3rem 1.5rem 2rem'}}>
        {paragraphs.map((para, pi) => (
          <div key={pi} style={{marginBottom:'2.2rem'}}>
            {para.sentences.map(sent => (
              <span key={sent.id}>
                <span className="sentence-wrap">
                  <span id={'sent-'+sent.id} style={{
                    fontFamily:'var(--body)',fontSize:'clamp(1.05rem,2.2vw,1.2rem)',
                    lineHeight:2,color:'var(--ink)',borderRadius:3,display:'inline',
                    background: playState.playing && playState.idx === sent.id
                      ? 'var(--amber-hl)' : 'transparent',
                    transition:'background 0.3s',
                  }}>
                    {sent.words.map(w => w.isWord ? (
                      <span key={w.key} data-tooltip="1"
                        onClick={e => { e.stopPropagation(); onWordClick(w.cw, w.tok.trim(), e.currentTarget.getBoundingClientRect()); }}
                        style={{
                          display:'inline',borderRadius:3,padding:'0 1px',cursor:'pointer',
                          transition:'background 0.15s,color 0.15s',
                          borderBottom: (wordBank[w.cw]||0) >= 3 ? '2px solid var(--amber2)'
                            : (wordBank[w.cw]||0) === 2 ? '1.5px dotted var(--amber3)' : 'none',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(168,120,32,0.14)'; e.currentTarget.style.color='var(--amber)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
                      >{w.tok}</span>
                    ) : (
                      <span key={w.key} style={{display:'inline'}}>{w.tok}</span>
                    ))}
                  </span>
                  {/* sentence action buttons */}
                  <span className="sent-actions" style={{display:'inline-flex',alignItems:'center',
                    gap:4,verticalAlign:'middle',margin:'0 4px',opacity:0,transition:'opacity 0.2s'}}>
                    <button onClick={() => { speakText(sent.text, speed); }}
                      style={{fontFamily:'var(--ui)',fontSize:'0.68rem',fontWeight:500,
                        background:'var(--paper2)',color:'var(--ink2)',border:'1px solid var(--paper3)',
                        borderRadius:4,padding:'2px 7px',cursor:'pointer',lineHeight:1.5}}>▶ 听</button>
                    <button onClick={() => toggleSentTrans(sent.id, sent.text)}
                      style={{fontFamily:'var(--ui)',fontSize:'0.68rem',fontWeight:500,
                        background:'var(--paper2)',color:'var(--ink2)',border:'1px solid var(--paper3)',
                        borderRadius:4,padding:'2px 7px',cursor:'pointer',lineHeight:1.5}}>译</button>
                  </span>{' '}
                </span>
                {/* sentence translation */}
                {sentTrans[sent.id] && (
                  <div style={{fontFamily:'var(--ui)',fontSize:'0.9rem',color:'var(--ink2)',
                    background:'var(--paper2)',borderLeft:'3px solid var(--amber)',
                    padding:'0.6rem 0.9rem',margin:'0.3rem 0 0.6rem 1.2rem',
                    borderRadius:'0 8px 8px 0',lineHeight:1.7,animation:'slideIn 0.2s ease'}}>
                    {sentTrans[sent.id].loading ? <><Dots/> 翻译中</> : sentTrans[sent.id].text}
                  </div>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* ANALYSIS */}
      <div style={{maxWidth:740,margin:'0 auto',padding:'0 1.5rem 3rem'}}>
        <hr style={{border:'none',borderTop:'1px solid var(--paper3)',margin:'2.5rem 0 1.5rem'}}/>
        <details>
          <summary style={{fontFamily:'var(--ui)',fontSize:'0.82rem',fontWeight:500,
            color:'var(--ink2)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',
            padding:'0.65rem 0',userSelect:'none',listStyle:'none',letterSpacing:'0.03em',textTransform:'uppercase'}}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            全文翻译
            <span style={{fontSize:'0.72rem',color:'var(--ink3)',fontWeight:400,textTransform:'none',letterSpacing:0,marginLeft:2}}>— 先理解再对照</span>
          </summary>
          <div style={{fontFamily:'var(--ui)',fontSize:'0.98rem',lineHeight:1.9,color:'var(--ink2)',
            whiteSpace:'pre-wrap',padding:'1rem',background:'var(--paper2)',borderRadius:14,border:'1px solid var(--paper3)'}}>
            {!fullTrans ? '加载中…'
              : fullTrans.loading ? <><Dots/> 全文翻译生成中</>
              : fullTrans.text}
          </div>
        </details>

        <hr style={{border:'none',borderTop:'1px solid var(--paper3)',margin:'1.5rem 0'}} id="word-bank-section"/>
        <details open>
          <summary style={{fontFamily:'var(--ui)',fontSize:'0.82rem',fontWeight:500,
            color:'var(--ink2)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',
            padding:'0.65rem 0',userSelect:'none',listStyle:'none',letterSpacing:'0.03em',textTransform:'uppercase'}}>
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            我的生词本
            <span style={{fontSize:'0.72rem',color:'var(--ink3)',fontWeight:400,textTransform:'none',letterSpacing:0,marginLeft:2}}>
              {sortedBank.length ? `— 共 ${sortedBank.length} 个词` : '— 点击单词后出现在这里'}
            </span>
          </summary>
          {sortedBank.length === 0 ? (
            <p style={{fontFamily:'var(--ui)',fontSize:'0.88rem',color:'var(--ink3)',padding:'0.5rem 0',fontStyle:'italic'}}>
              点击文章中的单词并选择"加入生词本"，它们会出现在这里。
            </p>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'0.6rem',marginTop:'0.5rem'}}>
              {sortedBank.map(([word, cnt]) => {
                const entry = wordCache[word] || DICT[word] || {};
                return (
                  <div key={word} onClick={() => speakText(word, speed)}
                    style={{background:'white',border:'1px solid var(--paper3)',borderRadius:14,
                      padding:'0.7rem 0.9rem',cursor:'pointer',transition:'all 0.2s'}}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='var(--amber)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='var(--paper3)'; e.currentTarget.style.transform=''; }}>
                    <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:4,marginBottom:3}}>
                      <span style={{fontFamily:'var(--body)',fontSize:'1rem',color:'var(--ink)'}}>{word}</span>
                      <span style={{fontFamily:'var(--ui)',fontSize:'0.62rem',background:'var(--amber-bg)',
                        color:'var(--amber)',borderRadius:10,padding:'1px 6px',fontWeight:500}}>×{cnt}</span>
                    </div>
                    {entry.ph && <div style={{fontFamily:'var(--ui)',fontSize:'0.7rem',color:'var(--ink3)',marginBottom:4}}>{entry.ph}</div>}
                    <div style={{fontFamily:'var(--ui)',fontSize:'0.76rem',color:'var(--ink2)',lineHeight:1.4}}>{entry.zh || '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </details>
      </div>

      {/* FLOATING CONTROLS */}
      <div style={{position:'fixed',bottom:'1.5rem',left:'50%',transform:'translateX(-50%)',
        background:'#26201a',border:'1px solid rgba(255,255,255,0.07)',borderRadius:50,
        padding:'0.55rem 1.1rem',display:'flex',alignItems:'center',gap:'0.6rem',
        boxShadow:'0 8px 40px rgba(0,0,0,0.45)',zIndex:200,maxWidth:'calc(100vw - 2rem)',flexWrap:'wrap',justifyContent:'center'}}>
        <button onClick={togglePlay} style={{background:'transparent',border:'none',
          color:'rgba(255,255,255,0.7)',cursor:'pointer',padding:'0.4rem',borderRadius:6,display:'flex'}}>
          {playState.playing
            ? <svg viewBox="0 0 24 24" width="18" height="18" fill="rgba(255,255,255,0.8)"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            : <svg viewBox="0 0 24 24" width="18" height="18" fill="rgba(255,255,255,0.8)"><polygon points="5,3 19,12 5,21"/></svg>}
        </button>
        <button onClick={stopPlay} style={{background:'transparent',border:'none',
          color:'rgba(255,255,255,0.7)',cursor:'pointer',padding:'0.4rem',borderRadius:6,display:'flex'}}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="rgba(255,255,255,0.8)"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
        </button>
        <div style={{width:1,height:18,background:'rgba(255,255,255,0.12)',flexShrink:0}}/>
        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
          <div style={{width:80,height:3,background:'rgba(255,255,255,0.15)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',background:'#e8b830',borderRadius:2,
              width: allSentences.length ? `${(playState.idx/allSentences.length*100).toFixed(0)}%` : '0%',
              transition:'width 0.4s ease'}}/>
          </div>
          <span style={{fontFamily:'var(--ui)',fontSize:'0.68rem',color:'rgba(255,255,255,0.4)',whiteSpace:'nowrap'}}>
            {playState.idx} / {allSentences.length}
          </span>
        </div>
        <div style={{width:1,height:18,background:'rgba(255,255,255,0.12)',flexShrink:0}}/>
        <span style={{fontFamily:'var(--ui)',fontSize:'0.72rem',color:'rgba(255,255,255,0.4)',flexShrink:0}}>速度</span>
        <div style={{display:'flex',gap:3}}>
          {[0.7,0.85,1.0,1.2].map(s => (
            <button key={s} onClick={() => changeSpeed(s)} style={{
              background: speed===s ? 'rgba(255,255,255,0.14)' : 'transparent',
              border:`1px solid ${speed===s ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)'}`,
              color: speed===s ? 'white' : 'rgba(255,255,255,0.55)',
              borderRadius:20,padding:'3px 9px',fontSize:'0.72rem',fontFamily:'var(--ui)',cursor:'pointer',
            }}>{s}×</button>
          ))}
        </div>
      </div>

      {/* TOOLTIP */}
      {tooltip && (
        <div data-tipbox="1">
          <Tooltip
            data={tooltip}
            onClose={() => setTooltip(null)}
            onAddToBank={() => addToBank(tooltip.word)}
            inBank={!!(wordBank[tooltip?.word])}
          />
        </div>
      )}

      {/* hover styles for sentence action buttons */}
      <style>{`
        .sentence-wrap:hover .sent-actions { opacity: 1 !important; }
        .sent-actions button:hover { background: var(--amber) !important; color: white !important; border-color: var(--amber) !important; }
        @media (prefers-color-scheme: dark) {
          nav { background: rgba(24,18,8,0.92) !important; }
          details div[style*="background:white"], div[style*="background: white"] { background: #201808 !important; }
        }
      `}</style>
    </div>
  );
}
