import{j as s}from"./jsx-runtime-BjG_zV1W.js";import{S as o,T as S,d as b}from"./TokenShowcase-DUCnWGJz.js";import"./index-BWu4c2F4.js";const B={title:"Design Tokens/Spacing",tags:["autodocs"],parameters:{docs:{description:{component:"Spacing and border-radius tokens built on a 4px grid system. Consistent spacing ensures visual rhythm across the clinical interface."}}}},k=[{name:"xs",cssVar:"--spacing-xs",size:"4px"},{name:"sm",cssVar:"--spacing-sm",size:"8px"},{name:"md",cssVar:"--spacing-md",size:"12px"},{name:"base",cssVar:"--spacing-base",size:"16px"},{name:"lg",cssVar:"--spacing-lg",size:"24px"},{name:"xl",cssVar:"--spacing-xl",size:"32px"},{name:"2xl",cssVar:"--spacing-2xl",size:"48px"},{name:"3xl",cssVar:"--spacing-3xl",size:"64px"},{name:"4xl",cssVar:"--spacing-4xl",size:"96px"}],f=[{name:"none",cssVar:"--radius-none",value:"0px"},{name:"sm",cssVar:"--radius-sm",value:"4px"},{name:"md",cssVar:"--radius-md",value:"8px"},{name:"lg",cssVar:"--radius-lg",value:"12px"},{name:"xl",cssVar:"--radius-xl",value:"16px"},{name:"full",cssVar:"--radius-full",value:"9999px"}],z=[{name:"Button SM",cssVar:"--size-button-sm",value:"32px"},{name:"Button MD",cssVar:"--size-button-md",value:"40px"},{name:"Button LG",cssVar:"--size-button-lg",value:"48px"},{name:"Input Height",cssVar:"--size-input-height",value:"44px"},{name:"Icon SM",cssVar:"--size-icon-sm",value:"16px"},{name:"Icon MD",cssVar:"--size-icon-md",value:"20px"},{name:"Icon LG",cssVar:"--size-icon-lg",value:"24px"}],y=[{name:"Mobile",cssVar:"--breakpoint-mobile",value:"320px"},{name:"Tablet",cssVar:"--breakpoint-tablet",value:"768px"},{name:"Desktop",cssVar:"--breakpoint-desktop",value:"1024px"},{name:"Wide",cssVar:"--breakpoint-wide",value:"1441px"}],a={render:()=>s.jsxs(o,{title:"Spacing Scale (4px Grid)",children:[s.jsx("p",{style:{fontSize:"14px",color:"#666",marginBottom:"16px"},children:"All spacing tokens follow a 4px base grid for consistent rhythm."}),k.map(e=>s.jsx(b,{name:e.name,cssVar:e.cssVar,size:e.size},e.cssVar))]})},r={render:()=>s.jsx(o,{title:"Border Radius",children:s.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"24px"},children:f.map(e=>s.jsxs("div",{style:{textAlign:"center"},children:[s.jsx("div",{style:{width:"80px",height:"80px",borderRadius:e.value,backgroundColor:"#E6F0FA",border:"2px solid #0066CC",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:600,color:"#0066CC"},children:e.name}),s.jsx("code",{style:{fontSize:"11px",display:"block",marginTop:"8px",color:"#666"},children:e.cssVar}),s.jsx("div",{style:{fontSize:"12px",fontWeight:600,marginTop:"2px"},children:e.value})]},e.cssVar))})})},n={render:()=>s.jsx(o,{title:"Component Sizes",children:z.map(e=>s.jsx(S,{name:e.name,cssVar:e.cssVar,value:e.value,preview:s.jsx("div",{style:{width:e.value,height:e.value,backgroundColor:"#CCE0F5",borderRadius:"4px",border:"1px dashed #0066CC"}})},e.cssVar))})},i={render:()=>s.jsxs(o,{title:"Breakpoints",children:[s.jsx("p",{style:{fontSize:"14px",color:"#666",marginBottom:"16px"},children:"Responsive breakpoints for mobile-first design."}),y.map(e=>s.jsx(S,{name:e.name,cssVar:e.cssVar,value:e.value,preview:s.jsx("div",{style:{width:`${Math.min(parseInt(e.value,10)/10,120)}px`,height:"20px",backgroundColor:"#66A3E0",borderRadius:"4px"}})},e.cssVar))]})};var t,p,c;a.parameters={...a.parameters,docs:{...(t=a.parameters)==null?void 0:t.docs,source:{originalSource:`{
  render: () => <Section title="Spacing Scale (4px Grid)">\r
      <p style={{
      fontSize: '14px',
      color: '#666',
      marginBottom: '16px'
    }}>\r
        All spacing tokens follow a 4px base grid for consistent rhythm.\r
      </p>\r
      {spacingTokens.map(t => <SpacingBox key={t.cssVar} name={t.name} cssVar={t.cssVar} size={t.size} />)}\r
    </Section>
}`,...(c=(p=a.parameters)==null?void 0:p.docs)==null?void 0:c.source}}};var l,d,m;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <Section title="Border Radius">\r
      <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px'
    }}>\r
        {radiusTokens.map(t => <div key={t.cssVar} style={{
        textAlign: 'center'
      }}>\r
            <div style={{
          width: '80px',
          height: '80px',
          borderRadius: t.value,
          backgroundColor: '#E6F0FA',
          border: '2px solid #0066CC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600,
          color: '#0066CC'
        }}>\r
              {t.name}\r
            </div>\r
            <code style={{
          fontSize: '11px',
          display: 'block',
          marginTop: '8px',
          color: '#666'
        }}>\r
              {t.cssVar}\r
            </code>\r
            <div style={{
          fontSize: '12px',
          fontWeight: 600,
          marginTop: '2px'
        }}>{t.value}</div>\r
          </div>)}\r
      </div>\r
    </Section>
}`,...(m=(d=r.parameters)==null?void 0:d.docs)==null?void 0:m.source}}};var x,u,g;n.parameters={...n.parameters,docs:{...(x=n.parameters)==null?void 0:x.docs,source:{originalSource:`{
  render: () => <Section title="Component Sizes">\r
      {sizeTokens.map(t => <TokenRow key={t.cssVar} name={t.name} cssVar={t.cssVar} value={t.value} preview={<div style={{
      width: t.value,
      height: t.value,
      backgroundColor: '#CCE0F5',
      borderRadius: '4px',
      border: '1px dashed #0066CC'
    }} />} />)}\r
    </Section>
}`,...(g=(u=n.parameters)==null?void 0:u.docs)==null?void 0:g.source}}};var v,V,h;i.parameters={...i.parameters,docs:{...(v=i.parameters)==null?void 0:v.docs,source:{originalSource:`{
  render: () => <Section title="Breakpoints">\r
      <p style={{
      fontSize: '14px',
      color: '#666',
      marginBottom: '16px'
    }}>\r
        Responsive breakpoints for mobile-first design.\r
      </p>\r
      {breakpoints.map(t => <TokenRow key={t.cssVar} name={t.name} cssVar={t.cssVar} value={t.value} preview={<div style={{
      width: \`\${Math.min(parseInt(t.value, 10) / 10, 120)}px\`,
      height: '20px',
      backgroundColor: '#66A3E0',
      borderRadius: '4px'
    }} />} />)}\r
    </Section>
}`,...(h=(V=i.parameters)==null?void 0:V.docs)==null?void 0:h.source}}};const R=["SpacingScale","BorderRadius","ComponentSizes","Breakpoints"];export{r as BorderRadius,i as Breakpoints,n as ComponentSizes,a as SpacingScale,R as __namedExportsOrder,B as default};
