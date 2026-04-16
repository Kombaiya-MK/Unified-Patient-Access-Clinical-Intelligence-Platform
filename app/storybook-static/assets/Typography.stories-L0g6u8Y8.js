import{j as a}from"./jsx-runtime-BjG_zV1W.js";import{S as t,T as s}from"./TokenShowcase-DUCnWGJz.js";import"./index-BWu4c2F4.js";const $={title:"Design Tokens/Typography",tags:["autodocs"],parameters:{docs:{description:{component:"Typography tokens for font families, sizes, weights, line heights, and letter spacing. Based on the Inter typeface for optimal screen readability in clinical UIs."}}}},T=[{name:"Heading",cssVar:"--typography-font-family-heading",value:"Inter, -apple-system, …, sans-serif"},{name:"Body",cssVar:"--typography-font-family-body",value:"Inter, -apple-system, …, sans-serif"},{name:"Mono",cssVar:"--typography-font-family-mono",value:"Fira Code, Consolas, …, monospace"}],F=[{name:"xs",cssVar:"--typography-font-size-xs",value:"12px",usage:"Caption, helper text"},{name:"sm",cssVar:"--typography-font-size-sm",value:"14px",usage:"Body small, labels"},{name:"base",cssVar:"--typography-font-size-base",value:"16px",usage:"Default body text"},{name:"lg",cssVar:"--typography-font-size-lg",value:"18px",usage:"Body large, H4"},{name:"xl",cssVar:"--typography-font-size-xl",value:"20px",usage:"H3"},{name:"2xl",cssVar:"--typography-font-size-2xl",value:"24px",usage:"H2"},{name:"3xl",cssVar:"--typography-font-size-3xl",value:"32px",usage:"H1 page titles"},{name:"4xl",cssVar:"--typography-font-size-4xl",value:"48px",usage:"Display large"}],R=[{name:"Regular",cssVar:"--typography-font-weight-regular",value:"400",usage:"Body text"},{name:"Medium",cssVar:"--typography-font-weight-medium",value:"500",usage:"Labels, emphasis"},{name:"Semibold",cssVar:"--typography-font-weight-semibold",value:"600",usage:"Headings"},{name:"Bold",cssVar:"--typography-font-weight-bold",value:"700",usage:"Display, H1"}],B=[{name:"Tight",cssVar:"--typography-line-height-tight",value:"1.2"},{name:"Snug",cssVar:"--typography-line-height-snug",value:"1.25"},{name:"Normal",cssVar:"--typography-line-height-normal",value:"1.33"},{name:"Relaxed",cssVar:"--typography-line-height-relaxed",value:"1.43"},{name:"Loose",cssVar:"--typography-line-height-loose",value:"1.5"},{name:"Spacious",cssVar:"--typography-line-height-spacious",value:"1.56"},{name:"Extra",cssVar:"--typography-line-height-extra",value:"1.8"}],k=[{name:"Tight",cssVar:"--typography-letter-spacing-tight",value:"-0.5px"},{name:"Snug",cssVar:"--typography-letter-spacing-snug",value:"-0.25px"},{name:"Normal",cssVar:"--typography-letter-spacing-normal",value:"0px"},{name:"Wide",cssVar:"--typography-letter-spacing-wide",value:"0.1px"},{name:"Wider",cssVar:"--typography-letter-spacing-wider",value:"0.18px"},{name:"Widest",cssVar:"--typography-letter-spacing-widest",value:"1px"}],i={render:()=>a.jsx(t,{title:"Font Families",children:T.map(e=>a.jsx(s,{name:e.name,cssVar:e.cssVar,value:e.value,preview:a.jsx("span",{style:{fontFamily:`var(${e.cssVar})`,fontSize:"20px"},children:"Aa Bb Cc 123"})},e.cssVar))})},r={render:()=>a.jsx(t,{title:"Font Sizes",children:F.map(e=>a.jsx(s,{name:`${e.name} — ${e.usage}`,cssVar:e.cssVar,value:e.value,preview:a.jsx("span",{style:{fontSize:e.value,lineHeight:1.2,whiteSpace:"nowrap"},children:"Patient Record"})},e.cssVar))})},n={render:()=>a.jsx(t,{title:"Font Weights",children:R.map(e=>a.jsx(s,{name:`${e.name} — ${e.usage}`,cssVar:e.cssVar,value:e.value,preview:a.jsx("span",{style:{fontWeight:Number(e.value),fontSize:"18px"},children:"Appointment Scheduled"})},e.cssVar))})},l={render:()=>a.jsx(t,{title:"Line Heights",children:B.map(e=>a.jsx(s,{name:e.name,cssVar:e.cssVar,value:e.value,preview:a.jsx("div",{style:{lineHeight:e.value,fontSize:"14px",width:"180px",backgroundColor:"#E6F0FA",padding:"4px 8px",borderRadius:"4px"},children:"Multi-line text sample for line height preview"})},e.cssVar))})},o={render:()=>a.jsx(t,{title:"Letter Spacing",children:k.map(e=>a.jsx(s,{name:e.name,cssVar:e.cssVar,value:e.value,preview:a.jsx("span",{style:{letterSpacing:e.value,fontSize:"16px",textTransform:e.name==="Widest"?"uppercase":void 0},children:"Clinical Dashboard"})},e.cssVar))})},p={render:()=>a.jsx(t,{title:"Type Scale Preview",children:a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"12px"},children:[a.jsx("div",{style:{fontSize:"48px",fontWeight:700,lineHeight:1.2,letterSpacing:"-0.5px"},children:"Display (4xl / Bold)"}),a.jsx("div",{style:{fontSize:"32px",fontWeight:700,lineHeight:1.25,letterSpacing:"-0.25px"},children:"H1 – Page Title (3xl / Bold)"}),a.jsx("div",{style:{fontSize:"24px",fontWeight:600,lineHeight:1.33},children:"H2 – Section Heading (2xl / Semibold)"}),a.jsx("div",{style:{fontSize:"20px",fontWeight:600,lineHeight:1.43},children:"H3 – Sub-section (xl / Semibold)"}),a.jsx("div",{style:{fontSize:"18px",fontWeight:500,lineHeight:1.33},children:"H4 – Card Title (lg / Medium)"}),a.jsx("div",{style:{fontSize:"16px",fontWeight:400,lineHeight:1.5},children:"Body – Default text size used for paragraphs and form inputs. (base / Regular)"}),a.jsx("div",{style:{fontSize:"14px",fontWeight:400,lineHeight:1.43},children:"Body Small – Table cells, sidebar labels, helper. (sm / Regular)"}),a.jsx("div",{style:{fontSize:"12px",fontWeight:400,lineHeight:1.33,color:"#666"},children:"Caption – Timestamps, meta info, fine print. (xs / Regular)"})]})})};var c,g,d;i.parameters={...i.parameters,docs:{...(c=i.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <Section title="Font Families">\r
      {fontFamilies.map(t => <TokenRow key={t.cssVar} name={t.name} cssVar={t.cssVar} value={t.value} preview={<span style={{
      fontFamily: \`var(\${t.cssVar})\`,
      fontSize: '20px'
    }}>\r
              Aa Bb Cc 123\r
            </span>} />)}\r
    </Section>
}`,...(d=(g=i.parameters)==null?void 0:g.docs)==null?void 0:d.source}}};var m,h,u;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <Section title="Font Sizes">\r
      {fontSizes.map(t => <TokenRow key={t.cssVar} name={\`\${t.name} — \${t.usage}\`} cssVar={t.cssVar} value={t.value} preview={<span style={{
      fontSize: t.value,
      lineHeight: 1.2,
      whiteSpace: 'nowrap'
    }}>\r
              Patient Record\r
            </span>} />)}\r
    </Section>
}`,...(u=(h=r.parameters)==null?void 0:h.docs)==null?void 0:u.source}}};var y,x,v;n.parameters={...n.parameters,docs:{...(y=n.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <Section title="Font Weights">\r
      {fontWeights.map(t => <TokenRow key={t.cssVar} name={\`\${t.name} — \${t.usage}\`} cssVar={t.cssVar} value={t.value} preview={<span style={{
      fontWeight: Number(t.value),
      fontSize: '18px'
    }}>\r
              Appointment Scheduled\r
            </span>} />)}\r
    </Section>
}`,...(v=(x=n.parameters)==null?void 0:x.docs)==null?void 0:v.source}}};var f,S,V;l.parameters={...l.parameters,docs:{...(f=l.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <Section title="Line Heights">\r
      {lineHeights.map(t => <TokenRow key={t.cssVar} name={t.name} cssVar={t.cssVar} value={t.value} preview={<div style={{
      lineHeight: t.value,
      fontSize: '14px',
      width: '180px',
      backgroundColor: '#E6F0FA',
      padding: '4px 8px',
      borderRadius: '4px'
    }}>\r
              Multi-line text sample for line height preview\r
            </div>} />)}\r
    </Section>
}`,...(V=(S=l.parameters)==null?void 0:S.docs)==null?void 0:V.source}}};var z,H,b;o.parameters={...o.parameters,docs:{...(z=o.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <Section title="Letter Spacing">\r
      {letterSpacings.map(t => <TokenRow key={t.cssVar} name={t.name} cssVar={t.cssVar} value={t.value} preview={<span style={{
      letterSpacing: t.value,
      fontSize: '16px',
      textTransform: t.name === 'Widest' ? 'uppercase' : undefined
    }}>\r
              Clinical Dashboard\r
            </span>} />)}\r
    </Section>
}`,...(b=(H=o.parameters)==null?void 0:H.docs)==null?void 0:b.source}}};var w,W,j;p.parameters={...p.parameters,docs:{...(w=p.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <Section title="Type Scale Preview">\r
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>\r
        <div style={{
        fontSize: '48px',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.5px'
      }}>\r
          Display (4xl / Bold)\r
        </div>\r
        <div style={{
        fontSize: '32px',
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: '-0.25px'
      }}>\r
          H1 – Page Title (3xl / Bold)\r
        </div>\r
        <div style={{
        fontSize: '24px',
        fontWeight: 600,
        lineHeight: 1.33
      }}>\r
          H2 – Section Heading (2xl / Semibold)\r
        </div>\r
        <div style={{
        fontSize: '20px',
        fontWeight: 600,
        lineHeight: 1.43
      }}>\r
          H3 – Sub-section (xl / Semibold)\r
        </div>\r
        <div style={{
        fontSize: '18px',
        fontWeight: 500,
        lineHeight: 1.33
      }}>\r
          H4 – Card Title (lg / Medium)\r
        </div>\r
        <div style={{
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.5
      }}>\r
          Body – Default text size used for paragraphs and form inputs. (base / Regular)\r
        </div>\r
        <div style={{
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: 1.43
      }}>\r
          Body Small – Table cells, sidebar labels, helper. (sm / Regular)\r
        </div>\r
        <div style={{
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: 1.33,
        color: '#666'
      }}>\r
          Caption – Timestamps, meta info, fine print. (xs / Regular)\r
        </div>\r
      </div>\r
    </Section>
}`,...(j=(W=p.parameters)==null?void 0:W.docs)==null?void 0:j.source}}};const A=["FontFamilies","FontSizes","FontWeights","LineHeights","LetterSpacing","TypeScale"];export{i as FontFamilies,r as FontSizes,n as FontWeights,o as LetterSpacing,l as LineHeights,p as TypeScale,A as __namedExportsOrder,$ as default};
