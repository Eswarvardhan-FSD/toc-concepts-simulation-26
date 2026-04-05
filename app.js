'use strict';

const GRAMMARS = {
  anbn: {
    name: 'aⁿbⁿ Language',
    cfg: [
      { lhs: 'S', rhs: 'aSb' },
      { lhs: 'S', rhs: 'ε'   }
    ],
    alphabet: ['a','b'],
    hint: 'Try: aabb, aaabbb, ab, or empty string',
    simplifySteps: [
      { title: 'Step 1 — Identify ε-Productions', desc: 'S → ε makes S nullable. Since S appears in S → aSb, we add S → ab (substituting ε for inner S).', change: 'S → aSb | ab | ε    (ε-removed version added)' },
      { title: 'Step 2 — Remove ε-Production', desc: 'Remove S → ε from non-start rules. The PDA handles empty string acceptance via stack condition.', change: 'S → aSb | ab' },
      { title: 'Step 3 — Check Unit Productions', desc: 'A unit production is A → B where B is a single non-terminal. None exist here.', change: 'No unit productions found. ✓' },
      { title: 'Step 4 — Remove Useless Symbols', desc: 'Every symbol is reachable from S and generates terminal strings.', change: 'All symbols are useful. ✓\nSimplified: S → aSb | ab' }
    ],
    simplifiedCFG: [
      { lhs: 'S', rhs: 'aSb' },
      { lhs: 'S', rhs: 'ab'  }
    ],
    cnfSteps: [
      { title: 'Step 1 — Introduce Terminal Variables', desc: 'In CNF, terminals in mixed rules must be replaced. Create: Tₐ → a  and  T_b → b.', change: 'Tₐ → a\nT_b → b' },
      { title: 'Step 2 — Replace Terminals in Long Rules', desc: 'S → aSb has length 3. Replace a and b with their variables.', change: 'S → Tₐ S T_b' },
      { title: 'Step 3 — Binarize (Break Length-3 Rules)', desc: 'S → Tₐ S T_b has 3 symbols. Introduce helper X₁.', change: 'S  → Tₐ X₁\nX₁ → S T_b' },
      { title: 'Step 4 — Handle S → ab', desc: 'S → ab has 2 terminals → replace with S → Tₐ T_b (valid CNF A→BC).', change: 'S → Tₐ T_b' },
      { title: 'Final CNF Grammar', desc: 'Every rule is either A → BC or A → a.', change: 'S  → Tₐ X₁  |  Tₐ T_b\nX₁ → S T_b\nTₐ → a\nT_b → b' }
    ],
    cnfRules: [
      { lhs: 'S',   rhs: 'Tₐ X₁ | Tₐ T_b' },
      { lhs: 'X₁',  rhs: 'S T_b' },
      { lhs: 'Tₐ',  rhs: 'a' },
      { lhs: 'T_b', rhs: 'b' }
    ],
    pdaSimulate(input) {
      const steps = [], stack = ['$'];
      const snap = (state, sym, action, type) => steps.push({ state, symbol: sym === '' ? 'ε' : sym, stack: [...stack].reverse(), action, type });
      snap('q0','','Initialize: push bottom marker $','info');
      for (const ch of input) {
        if (ch !== 'a' && ch !== 'b') { snap('q_reject',ch,`Symbol '${ch}' not in alphabet {a,b}`,'reject'); return { steps, accepted:false, reason:`'${ch}' is not in alphabet {a,b}.` }; }
      }
      let seenB=false, rejected=false, rejectReason='';
      for (let i=0;i<input.length;i++) {
        const ch=input[i];
        if (ch==='a') {
          if (seenB) { snap('q_reject',ch,`'a' after 'b' — invalid structure`,'reject'); rejected=true; rejectReason="An 'a' was found after 'b'."; break; }
          stack.push('A'); snap('q0',ch,`Read 'a' → PUSH 'A' onto stack`,'push');
        } else {
          seenB=true;
          if (stack.length<=1||stack[stack.length-1]!=='A') { snap('q_reject',ch,`Read 'b' → Stack top is '${stack[stack.length-1]}', expected 'A'`,'reject'); rejected=true; rejectReason="More b's than a's."; break; }
          stack.pop(); snap('q1',ch,`Read 'b' → POP 'A' from stack`,'pop');
        }
      }
      if (!rejected) {
        if (stack.length===1&&stack[0]==='$') { snap('q_accept','ε','Input exhausted. Stack empty → ACCEPT','accept'); return { steps, accepted:true, reason:"Equal a's followed by equal b's. Stack empty at end." }; }
        else { const r=stack.filter(x=>x!=='$').length; snap('q_reject','ε',`${r} unmatched 'A' remain → REJECT`,'reject'); return { steps, accepted:false, reason:`More a's than b's: ${r} unmatched 'A' on stack.` }; }
      }
      return { steps, accepted:false, reason:rejectReason };
    }
  },

  balanced: {
    name: 'Balanced Parentheses',
    cfg: [
      { lhs:'S', rhs:'SS' }, { lhs:'S', rhs:'(S)' }, { lhs:'S', rhs:'ε' }
    ],
    alphabet:['(', ')'],
    hint: 'Try: ()(), (()), (()())',
    simplifySteps: [
      { title:'Step 1 — Nullable Variables', desc:'S → ε makes S nullable.', change:'Nullable: {S}' },
      { title:'Step 2 — Expand ε-Removed Versions', desc:'From S → SS remove one S → add S. From S → (S) remove S → add S → ().', change:'S → SS | (S) | ()' },
      { title:'Step 3 — Remove Unit Productions', desc:'S → S is trivial — remove it.', change:'S → SS | (S) | ()' },
      { title:'Step 4 — Useless Symbols', desc:'All symbols reachable and productive.', change:'Simplified:\nS → SS | (S) | ()' }
    ],
    simplifiedCFG: [{ lhs:'S', rhs:'SS' }, { lhs:'S', rhs:'(S)' }, { lhs:'S', rhs:'()' }],
    cnfSteps: [
      { title:'Step 1 — Terminal Variables', desc:'Introduce Tₗ → (  and  Tᵣ → )', change:'Tₗ → (\nTᵣ → )' },
      { title:'Step 2 — Replace Terminals', desc:'S → (S) becomes S → Tₗ S Tᵣ', change:'S → Tₗ S Tᵣ' },
      { title:'Step 3 — Binarize', desc:'Length 3 rule → introduce Y₁.', change:'S  → Tₗ Y₁\nY₁ → S Tᵣ' },
      { title:'Step 4 — S → ()', desc:'Two terminals → S → Tₗ Tᵣ (valid CNF).', change:'S → Tₗ Tᵣ' },
      { title:'Final CNF Grammar', desc:'All rules in CNF.', change:'S  → SS | Tₗ Y₁ | Tₗ Tᵣ\nY₁ → S Tᵣ\nTₗ → (\nTᵣ → )' }
    ],
    cnfRules: [
      { lhs:'S',  rhs:'SS | Tₗ Y₁ | Tₗ Tᵣ' },
      { lhs:'Y₁', rhs:'S Tᵣ' },
      { lhs:'Tₗ', rhs:'(' },
      { lhs:'Tᵣ', rhs:')' }
    ],
    pdaSimulate(input) {
      const steps=[], stack=['$'];
      const snap=(state,sym,action,type)=>steps.push({state,symbol:sym===''?'ε':sym,stack:[...stack].reverse(),action,type});
      snap('q0','','Initialize: push bottom marker $','info');
      for (const ch of input) {
        if (ch!=='('&&ch!==')') { snap('q_reject',ch,`'${ch}' not in alphabet`,'reject'); return {steps,accepted:false,reason:`'${ch}' not in alphabet.`}; }
        if (ch==='(') { stack.push('('); snap('q0',ch,`Read '(' → PUSH '(' onto stack`,'push'); }
        else {
          if (stack.length<=1||stack[stack.length-1]!=='(') { snap('q_reject',ch,`Read ')' → No matching '(' → REJECT`,'reject'); return {steps,accepted:false,reason:"Closing ')' with no matching '('." }; }
          stack.pop(); snap('q0',ch,`Read ')' → POP '(' (matched pair)`,'pop');
        }
      }
      if (stack.length===1&&stack[0]==='$') { snap('q_accept','ε','Stack empty → ACCEPT','accept'); return {steps,accepted:true,reason:'Every parenthesis matched and closed.'}; }
      const l=stack.filter(x=>x!=='$').length;
      snap('q_reject','ε',`${l} unmatched '(' → REJECT`,'reject');
      return {steps,accepted:false,reason:`${l} opening parenthesis/parentheses unmatched.`};
    }
  },

  expr: {
    name: 'Arithmetic Expressions',
    cfg: [
      {lhs:'E',rhs:'E+T'},{lhs:'E',rhs:'T'},{lhs:'T',rhs:'T*F'},{lhs:'T',rhs:'F'},{lhs:'F',rhs:'(E)'},{lhs:'F',rhs:'a'}
    ],
    alphabet:['a','+','*','(', ')'],
    hint: 'Try: a, a+a, a*a, (a+a)*a',
    simplifySteps: [
      {title:'Step 1 — No ε-Productions',desc:'No variable generates ε.',change:'No ε-productions. ✓'},
      {title:'Step 2 — Remove Unit Productions',desc:'E → T and T → F are unit productions. Inline their rules.',change:'E → E+T | T*F | (E) | a\nT → T*F | (E) | a\nF → (E) | a'},
      {title:'Step 3 — Useless Symbols',desc:'All symbols reachable and productive.',change:'All symbols useful. ✓'},
      {title:'Step 4 — Final Simplified',desc:'After unit production removal.',change:'E → E+T | T*F | (E) | a\nT → T*F | (E) | a\nF → (E) | a'}
    ],
    simplifiedCFG:[{lhs:'E',rhs:'E+T | T*F | (E) | a'},{lhs:'T',rhs:'T*F | (E) | a'},{lhs:'F',rhs:'(E) | a'}],
    cnfSteps:[
      {title:'Step 1 — Terminal Variables',desc:'Variables for each terminal in mixed rules.',change:'T₊ → +\nT✶ → *\nTₗ → (\nTᵣ → )\nTₐ → a'},
      {title:'Step 2 — Replace Terminals',desc:'Replace in long rules.',change:'E → E T₊ T | T T✶ F | Tₗ E Tᵣ | Tₐ'},
      {title:'Step 3 — Binarize',desc:'Break all length-3 rules with helpers.',change:'X₁ → T₊ T\nX₂ → T✶ F\nX₃ → E Tᵣ'},
      {title:'Final CNF',desc:'All rules A→BC or A→a.',change:'E → E X₁|T X₂|Tₗ X₃|Tₐ\nT → T X₂|Tₗ X₃|Tₐ\nF → Tₗ X₃|Tₐ\nX₁→T₊ T  X₂→T✶ F  X₃→E Tᵣ'}
    ],
    cnfRules:[
      {lhs:'E',rhs:'E X₁ | T X₂ | Tₗ X₃ | Tₐ'},{lhs:'T',rhs:'T X₂ | Tₗ X₃ | Tₐ'},
      {lhs:'F',rhs:'Tₗ X₃ | Tₐ'},{lhs:'X₁',rhs:'T₊ T'},{lhs:'X₂',rhs:'T✶ F'},
      {lhs:'X₃',rhs:'E Tᵣ'},{lhs:'T₊',rhs:'+'},{lhs:'T✶',rhs:'*'},{lhs:'Tₗ',rhs:'('},{lhs:'Tᵣ',rhs:')'},{lhs:'Tₐ',rhs:'a'}
    ],
    pdaSimulate(input) {
      const steps=[], stack=['$'];
      const snap=(state,sym,action,type)=>steps.push({state,symbol:sym===''?'ε':sym,stack:[...stack].reverse(),action,type});
      snap('q0','','Initialize. Push start symbol E.','info');
      stack.push('E'); snap('q0','','PUSH E (start symbol)','push');
      const tokens=input.split('').filter(c=>c.trim()!=='');
      let pos=0, ok=true, rejectReason='';
      const valid=new Set(['a','+','*','(', ')']);
      for (const ch of tokens) { if(!valid.has(ch)){snap('q_reject',ch,`'${ch}' not in alphabet`,'reject');return{steps,accepted:false,reason:`'${ch}' not in alphabet.`};} }
      while(stack.length>1){
        const top=stack[stack.length-1], cur=pos<tokens.length?tokens[pos]:null;
        if(top==='E'){
          stack.pop();
          if(cur==='a'||cur==='('){stack.push('T_rest');stack.push('T');snap('q0',cur||'ε','POP E → PUSH T T_rest','pop');}
          else{snap('q_reject',cur||'ε','E: unexpected symbol','reject');ok=false;rejectReason=`Expected 'a' or '(' for expression, got '${cur}'.`;break;}
        } else if(top==='T_rest'){
          stack.pop();
          if(cur==='+'){stack.push('E_tail');snap('q0',cur||'ε','POP T_rest → PUSH E_tail','pop');}
          else{snap('q0',cur||'ε','POP T_rest → ε','pop');}
        } else if(top==='E_tail'){
          stack.pop();stack.push('T_rest');stack.push('T');stack.push('+');
          snap('q0',cur||'ε','POP E_tail → PUSH + T T_rest','pop');
        } else if(top==='T'){
          stack.pop();
          if(cur==='a'||cur==='('){stack.push('F_rest');stack.push('F');snap('q0',cur||'ε','POP T → PUSH F F_rest','pop');}
          else{snap('q_reject',cur||'ε','T: unexpected symbol','reject');ok=false;rejectReason=`Expected 'a' or '(', got '${cur}'.`;break;}
        } else if(top==='F_rest'){
          stack.pop();
          if(cur==='*'){stack.push('T_tail');snap('q0',cur||'ε','POP F_rest → PUSH T_tail','pop');}
          else{snap('q0',cur||'ε','POP F_rest → ε','pop');}
        } else if(top==='T_tail'){
          stack.pop();stack.push('F_rest');stack.push('F');stack.push('*');
          snap('q0',cur||'ε','POP T_tail → PUSH * F F_rest','pop');
        } else if(top==='F'){
          stack.pop();
          if(cur==='a'){stack.push('a');snap('q0',cur||'ε',"POP F → PUSH a  (F→a)",'pop');}
          else if(cur==='('){stack.push(')');stack.push('E');stack.push('(');snap('q0',cur||'ε',"POP F → PUSH ( E )  (F→(E))",'pop');}
          else{snap('q_reject',cur||'ε',`F: expected 'a' or '(', got '${cur}'`,'reject');ok=false;rejectReason=`Expected factor, got '${cur}'.`;break;}
        } else {
          if(cur===top){stack.pop();pos++;snap('q0',cur,`Read '${cur}' — matches '${top}' on stack`,'read');}
          else{snap('q_reject',cur||'ε',`Expected '${top}', got '${cur||"end"}'`,'reject');ok=false;rejectReason=`Expected '${top}' but got '${cur||"end of input"}'.`;break;}
        }
      }
      if(ok&&pos<tokens.length){snap('q_reject',tokens[pos],`Stack empty but input remains`,'reject');return{steps,accepted:false,reason:`Unconsumed input: '${tokens.slice(pos).join('')}'.`};}
      if(ok&&stack.length===1&&stack[0]==='$'){snap('q_accept','ε','Stack empty & input done → ACCEPT','accept');return{steps,accepted:true,reason:'Valid arithmetic expression.'};}
      return{steps,accepted:false,reason:rejectReason||'PDA rejected.'};
    }
  },

  palindrome: {
    name: 'Even Palindromes',
    cfg: [{lhs:'S',rhs:'aSa'},{lhs:'S',rhs:'bSb'},{lhs:'S',rhs:'ε'}],
    alphabet:['a','b'],
    hint: 'Try: abba, aabbaa, baab, abbaabba',
    simplifySteps:[
      {title:'Step 1 — Nullable Variable',desc:'S → ε makes S nullable.',change:'Nullable: {S}'},
      {title:'Step 2 — Add ε-Removed Versions',desc:'S → aSa without inner S → S → aa. S → bSb without S → S → bb.',change:'S → aSa | bSb | aa | bb | ε'},
      {title:'Step 3 — Remove ε',desc:'Remove S → ε; handled by PDA empty stack acceptance.',change:'S → aSa | bSb | aa | bb'},
      {title:'Step 4 — No Useless Symbols',desc:'All symbols productive and reachable.',change:'Simplified:\nS → aSa | bSb | aa | bb'}
    ],
    simplifiedCFG:[{lhs:'S',rhs:'aSa'},{lhs:'S',rhs:'bSb'},{lhs:'S',rhs:'aa'},{lhs:'S',rhs:'bb'}],
    cnfSteps:[
      {title:'Step 1 — Terminal Variables',desc:'Create Tₐ → a and T_b → b.',change:'Tₐ → a\nT_b → b'},
      {title:'Step 2 — Replace Terminals',desc:'S → aSa → Tₐ S Tₐ (length 3). S → bSb → T_b S T_b (length 3).',change:'S → Tₐ S Tₐ | T_b S T_b | Tₐ Tₐ | T_b T_b'},
      {title:'Step 3 — Binarize',desc:'Introduce P₁ and P₂ for length-3 rules.',change:'S  → Tₐ P₁ | T_b P₂ | Tₐ Tₐ | T_b T_b\nP₁ → S Tₐ\nP₂ → S T_b'},
      {title:'Final CNF',desc:'All rules in CNF.',change:'S  → Tₐ P₁ | T_b P₂ | Tₐ Tₐ | T_b T_b\nP₁ → S Tₐ\nP₂ → S T_b\nTₐ → a\nT_b → b'}
    ],
    cnfRules:[
      {lhs:'S',rhs:'Tₐ P₁ | T_b P₂ | Tₐ Tₐ | T_b T_b'},
      {lhs:'P₁',rhs:'S Tₐ'},{lhs:'P₂',rhs:'S T_b'},
      {lhs:'Tₐ',rhs:'a'},{lhs:'T_b',rhs:'b'}
    ],
    pdaSimulate(input){
      const steps=[], stack=['$'];
      const snap=(state,sym,action,type)=>steps.push({state,symbol:sym===''?'ε':sym,stack:[...stack].reverse(),action,type});
      snap('q0','','Initialize PDA for even palindrome.','info');
      for(const ch of input){if(ch!=='a'&&ch!=='b'){snap('q_reject',ch,`'${ch}' not in alphabet`,'reject');return{steps,accepted:false,reason:`'${ch}' not in alphabet.`};}}
      if(input.length===0){snap('q_accept','ε','Empty string — ε is even palindrome → ACCEPT','accept');return{steps,accepted:true,reason:'Empty string is an even palindrome.'};}
      if(input.length%2!==0){snap('q_reject','','Odd length — cannot be even palindrome','reject');return{steps,accepted:false,reason:'Odd length string cannot be an even palindrome.'};}
      const half=input.length/2, first=input.slice(0,half), second=input.slice(half);
      snap('q0','','Phase 1: Push first half onto stack.','info');
      for(let i=0;i<first.length;i++){stack.push(first[i].toUpperCase());snap('q0',first[i],`Read '${first[i]}' → PUSH '${first[i].toUpperCase()}'`,'push');}
      snap('q1','','Middle reached. Phase 2: Match second half vs stack.','info');
      for(let i=0;i<second.length;i++){
        const ch=second[i], top=stack[stack.length-1];
        if(top===ch.toUpperCase()){stack.pop();snap('q1',ch,`Read '${ch}' → POP '${top}' (match!)`,'pop');}
        else{snap('q_reject',ch,`Read '${ch}' → Stack top '${top}' ≠ '${ch.toUpperCase()}' → MISMATCH`,'reject');return{steps,accepted:false,reason:`Mismatch: '${second}' does not mirror '${first}'.`};}
      }
      if(stack.length===1&&stack[0]==='$'){snap('q_accept','ε','Stack empty — palindrome → ACCEPT','accept');return{steps,accepted:true,reason:`'${input}' is a valid even palindrome.`};}
      snap('q_reject','ε','Stack not empty → REJECT','reject');
      return{steps,accepted:false,reason:'String is not a palindrome.'};
    }
  }
};

// ── STATE ──
const state = { grammarKey:null, grammar:null, pdaResult:null, pdaSteps:[], stepIndex:0, playTimer:null, playing:false, inputStr:'' };

// ── HELPERS ──
const $ = id => document.getElementById(id);
const phases = [1,2,3,4,5].map(n=>$(`phase-${n}`));
const stepDots = [1,2,3,4,5].map(n=>$(`step-dot-${n}`));
const stepLines = document.querySelectorAll('.step-line');

function showPhase(n){
  phases.forEach((p,i)=>p.classList.toggle('active',i===n-1));
  stepDots.forEach((d,i)=>{
    d.classList.remove('active','done');
    if(i+1<n) d.classList.add('done');
    if(i+1===n) d.classList.add('active');
  });
  stepLines.forEach((l,i)=>l.classList.toggle('done',i<n-1));
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderRules(containerId, rules){
  const el=$(containerId); el.innerHTML='';
  rules.forEach(r=>{
    const row=document.createElement('div'); row.className='rule-row';
    row.innerHTML=`<span class="rule-lhs">${r.lhs}</span><span class="rule-arrow">→</span><span class="rule-rhs">${r.rhs}</span>`;
    el.appendChild(row);
  });
}

function revealSteps(containerId, stepsData, callback){
  const container=$(containerId); container.innerHTML='';
  stepsData.forEach((s,idx)=>{
    const div=document.createElement('div'); div.className='sim-step';
    div.innerHTML=`<div class="sim-step-header"><div class="step-icon">${String(idx+1).padStart(2,'0')}</div><div class="sim-step-title">${s.title}</div></div><div class="sim-step-body"><div class="sim-step-desc">${s.desc}</div>${s.change?`<div class="rule-change">${s.change.replace(/\n/g,'<br>')}</div>`:''}</div>`;
    container.appendChild(div);
    setTimeout(()=>{ div.classList.add('revealed'); if(idx===stepsData.length-1&&callback) callback(); }, 220*(idx+1));
  });
}

// ── PHASE 1 ──
document.querySelectorAll('.grammar-card').forEach(card=>{
  card.addEventListener('click',()=>{
    document.querySelectorAll('.grammar-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    const key=card.dataset.grammar;
    state.grammarKey=key; state.grammar=GRAMMARS[key];
    $('cfg-display').classList.remove('hidden');
    renderRules('cfg-rules', state.grammar.cfg);
    $('btn-to-simplify').disabled=false;
    $('input-hint').textContent=state.grammar.hint;
  });
});

$('btn-to-simplify').addEventListener('click',()=>{ showPhase(2); buildSimplifyPhase(); });

// ── PHASE 2 ──
function buildSimplifyPhase(){
  const g=state.grammar; $('simplify-result').style.display='none';
  revealSteps('simplify-steps', g.simplifySteps, ()=>{
    $('simplify-result').style.display='flex';
    renderRules('simplify-before', g.cfg);
    renderRules('simplify-after', g.simplifiedCFG);
  });
}

$('btn-back-1').addEventListener('click',()=>showPhase(1));
$('btn-to-cnf').addEventListener('click',()=>{ showPhase(3); buildCNFPhase(); });

// ── PHASE 3 ──
function buildCNFPhase(){
  const g=state.grammar; $('cnf-result').style.display='none';
  revealSteps('cnf-steps', g.cnfSteps, ()=>{
    $('cnf-result').style.display='flex';
    renderRules('cnf-before', g.simplifiedCFG);
    renderRules('cnf-after', g.cnfRules);
  });
}

$('btn-back-2').addEventListener('click',()=>showPhase(2));
$('btn-to-pda').addEventListener('click',()=>showPhase(4));

// ── PHASE 4 ──
$('btn-back-3').addEventListener('click',()=>{ stopPlayback(); showPhase(3); });
$('btn-run-pda').addEventListener('click',()=>runPDA($('pda-input').value.trim()));
$('pda-input').addEventListener('keydown',e=>{ if(e.key==='Enter') runPDA($('pda-input').value.trim()); });

function runPDA(input){
  stopPlayback();
  const result=state.grammar.pdaSimulate(input);
  state.pdaResult=result; state.pdaSteps=result.steps; state.stepIndex=0; state.inputStr=input;
  buildTape(input);
  $('pda-viz').classList.remove('hidden');
  $('transition-log').innerHTML='';
  resetStack();
  $('step-current').textContent='0';
  $('step-total').textContent=result.steps.length;
  $('btn-to-result').classList.remove('hidden');
  startPlayback();
}

function buildTape(input){
  const tape=$('tape-display'); tape.innerHTML='';
  const chars=input.split('');
  if(chars.length===0){
    const cell=document.createElement('div'); cell.className='tape-cell'; cell.textContent='ε'; tape.appendChild(cell);
  } else {
    chars.forEach((ch,i)=>{ const cell=document.createElement('div'); cell.className='tape-cell'; cell.id=`tape-${i}`; cell.textContent=ch; tape.appendChild(cell); });
    const end=document.createElement('div'); end.className='tape-end'; end.textContent='⊣'; tape.appendChild(end);
  }
}

function updateTape(){
  const cells=document.querySelectorAll('.tape-cell');
  const stepsUpToNow=state.pdaSteps.slice(0,state.stepIndex+1);
  let readCount=0;
  stepsUpToNow.forEach(s=>{ if((s.type==='push'||s.type==='pop'||s.type==='read')&&s.symbol!=='ε'&&s.symbol!=='') readCount++; });
  cells.forEach((cell,i)=>{ cell.classList.remove('current','read'); if(i<readCount-1) cell.classList.add('read'); else if(i===readCount-1) cell.classList.add('current'); });
}

let stackItems=[];

function resetStack(){ stackItems=['$']; renderStack(); }

function renderStack(){
  const sv=$('stack-visual'); sv.innerHTML='<div class="stack-bottom">⊥</div>';
  if(stackItems.length>1){ const tl=document.createElement('div'); tl.className='stack-top-label'; tl.textContent='▲ TOP'; sv.appendChild(tl); }
  for(let i=1;i<stackItems.length;i++){
    const item=document.createElement('div'); item.className='stack-item'; item.textContent=stackItems[i];
    sv.insertBefore(item,sv.firstChild);
  }
}

function applyStep(stepObj){
  stackItems=[...stepObj.stack].reverse();
  renderStack();
  const log=$('transition-log');
  const entry=document.createElement('div'); entry.className=`log-entry ${stepObj.type}`;
  const stateStr=`<strong>[${stepObj.state}]</strong>`;
  const symStr=stepObj.symbol!=='ε'?` read='${stepObj.symbol}'`:'';
  entry.innerHTML=`${stateStr}${symStr} — ${stepObj.action}`;
  log.appendChild(entry); log.scrollTop=log.scrollHeight;
  updateTape();
}

function getSpeed(){ const s=$('speed-slider'); return parseInt(s.max)-parseInt(s.value)+parseInt(s.min); }

function startPlayback(){ if(state.playing) return; state.playing=true; $('ctrl-play').textContent='⏸'; scheduleNext(); }
function pausePlayback(){ state.playing=false; $('ctrl-play').textContent='▶'; clearTimeout(state.playTimer); }
function stopPlayback(){ pausePlayback(); state.stepIndex=0; }

function scheduleNext(){
  if(!state.playing) return;
  if(state.stepIndex>=state.pdaSteps.length){ pausePlayback(); return; }
  state.playTimer=setTimeout(()=>{ stepForward(); scheduleNext(); }, getSpeed());
}

function stepForward(){
  if(state.stepIndex>=state.pdaSteps.length) return;
  applyStep(state.pdaSteps[state.stepIndex]);
  state.stepIndex++;
  $('step-current').textContent=state.stepIndex;
}

function stepBackward(){
  if(state.stepIndex<=0) return;
  state.stepIndex--;
  resetStack(); $('transition-log').innerHTML='';
  for(let i=0;i<state.stepIndex;i++) applyStep(state.pdaSteps[i]);
  $('step-current').textContent=state.stepIndex;
}

$('ctrl-play').addEventListener('click',()=>{ if(state.playing) pausePlayback(); else startPlayback(); });
$('ctrl-next').addEventListener('click',()=>{ pausePlayback(); stepForward(); });
$('ctrl-prev').addEventListener('click',()=>{ pausePlayback(); stepBackward(); });

// ── PHASE 5 ──
$('btn-to-result').addEventListener('click',()=>{ pausePlayback(); buildResultPhase(); showPhase(5); });

function buildResultPhase(){
  const result=state.pdaResult, input=state.inputStr;
  const box=$('result-box');
  box.className='result-box '+(result.accepted?'accept-box':'reject-box');
  $('result-icon').textContent=result.accepted?'✅':'❌';
  $('result-verdict').textContent=result.accepted?'ACCEPTED':'REJECTED';
  $('result-input-echo').innerHTML=`Input: <code>${input===''?'ε (empty)':input}</code>`;
  $('result-reason').textContent=result.reason;
  const tbody=$('trace-body'); tbody.innerHTML='';
  result.steps.forEach((s,i)=>{
    const tr=document.createElement('tr');
    let rc='';
    if(s.type==='push') rc='push-row';
    else if(s.type==='pop') rc='pop-row';
    else if(s.type==='accept') rc='final-row';
    else if(s.type==='reject') rc='reject-row';
    tr.className=rc;
    tr.innerHTML=`<td>${i+1}</td><td>${s.state}</td><td>${s.symbol}</td><td>${s.stack.join(' | ')||'(empty)'}</td><td>${s.action}</td>`;
    tbody.appendChild(tr);
  });
}

$('btn-back-4').addEventListener('click',()=>showPhase(4));
$('btn-restart').addEventListener('click',()=>{
  stopPlayback();
  state.grammarKey=null; state.grammar=null; state.pdaResult=null; state.pdaSteps=[]; state.stepIndex=0;
  document.querySelectorAll('.grammar-card').forEach(c=>c.classList.remove('selected'));
  $('cfg-display').classList.add('hidden');
  $('btn-to-simplify').disabled=true;
  $('pda-input').value='';
  $('pda-viz').classList.add('hidden');
  $('btn-to-result').classList.add('hidden');
  showPhase(1);
});

showPhase(1); 
