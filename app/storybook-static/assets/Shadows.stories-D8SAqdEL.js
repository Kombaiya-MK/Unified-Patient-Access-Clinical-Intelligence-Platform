import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{S as a,b as u}from"./TokenShowcase-DUCnWGJz.js";import"./index-BWu4c2F4.js";const b={title:"Design Tokens/Shadows",tags:["autodocs"],parameters:{docs:{description:{component:"Elevation shadow tokens from Level 0 (flat) to Level 5 (maximum) plus focus-ring and button-active states. Used for depth hierarchy in clinical UIs."}}}},m=[{name:"Level 0",cssVar:"--shadow-level-0",value:"none",usage:"Inline elements"},{name:"Level 1",cssVar:"--shadow-level-1",value:"0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)",usage:"Cards, list items"},{name:"Level 2",cssVar:"--shadow-level-2",value:"0px 3px 6px rgba(0,0,0,0.15), 0px 2px 4px rgba(0,0,0,0.12)",usage:"Dropdowns, popovers"},{name:"Level 3",cssVar:"--shadow-level-3",value:"0px 10px 20px rgba(0,0,0,0.15), 0px 3px 6px rgba(0,0,0,0.10)",usage:"Modals, drawers"},{name:"Level 4",cssVar:"--shadow-level-4",value:"0px 15px 25px rgba(0,0,0,0.15), 0px 5px 10px rgba(0,0,0,0.05)",usage:"Tooltips on modals"},{name:"Level 5",cssVar:"--shadow-level-5",value:"0px 20px 40px rgba(0,0,0,0.2)",usage:"Critical alerts"}],r=[{name:"Focus Ring",cssVar:"--shadow-focus-ring",value:"0 0 0 2px #FFFFFF, 0 0 0 4px #0066CC",usage:"Keyboard focus indicator"},{name:"Button Active",cssVar:"--shadow-button-active",value:"inset 0px 2px 4px rgba(0,0,0,0.2)",usage:"Button pressed state"}],l={render:()=>e.jsxs(a,{title:"Elevation Scale",children:[e.jsx("p",{style:{fontSize:"14px",color:"#666",marginBottom:"24px"},children:"Progressive shadow depth for visual hierarchy. Higher levels indicate elements closer to the user in z-space."}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:"24px"},children:m.map(s=>e.jsxs("div",{children:[e.jsx(u,{name:s.name,cssVar:s.cssVar,value:s.value}),e.jsx("div",{style:{fontSize:"12px",color:"#666",maxWidth:"160px",textAlign:"center"},children:s.usage})]},s.cssVar))})]})},o={render:()=>e.jsx(a,{title:"Special Shadows",children:e.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"32px"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{width:"200px",height:"44px",borderRadius:"8px",border:"2px solid #0066CC",backgroundColor:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:r[0].value,fontSize:"14px",fontWeight:500},children:"Focus Ring"}),e.jsx("code",{style:{fontSize:"11px",color:"#666",display:"block",marginTop:"8px"},children:r[0].cssVar}),e.jsx("div",{style:{fontSize:"12px",color:"#666",marginTop:"2px"},children:r[0].usage})]}),e.jsxs("div",{children:[e.jsx("button",{style:{width:"200px",height:"40px",borderRadius:"8px",border:"none",backgroundColor:"#0066CC",color:"#fff",fontSize:"14px",fontWeight:600,boxShadow:r[1].value,cursor:"pointer"},children:"Active / Pressed"}),e.jsx("code",{style:{fontSize:"11px",color:"#666",display:"block",marginTop:"8px"},children:r[1].cssVar}),e.jsx("div",{style:{fontSize:"12px",color:"#666",marginTop:"2px"},children:r[1].usage})]})]})})},t={render:()=>e.jsx(a,{title:"Shadow Usage Guidelines",children:e.jsxs("table",{style:{borderCollapse:"collapse",width:"100%",fontSize:"14px"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{borderBottom:"2px solid #e5e5e5"},children:[e.jsx("th",{style:{textAlign:"left",padding:"8px 12px"},children:"Level"}),e.jsx("th",{style:{textAlign:"left",padding:"8px 12px"},children:"z-index Range"}),e.jsx("th",{style:{textAlign:"left",padding:"8px 12px"},children:"Use Case"})]})}),e.jsx("tbody",{children:[{level:"0",z:"0",use:"Inline elements, no elevation needed"},{level:"1",z:"1–10",use:"Cards, list items, subtle elevation"},{level:"2",z:"10–100",use:"Dropdowns, popovers, menus"},{level:"3",z:"100–1000",use:"Modals, drawers, overlays"},{level:"4",z:"1000–5000",use:"Tooltips stacked on modals"},{level:"5",z:"5000+",use:"Critical alerts, emergency banners"}].map(s=>e.jsxs("tr",{style:{borderBottom:"1px solid #f0f0f0"},children:[e.jsxs("td",{style:{padding:"8px 12px",fontWeight:600},children:["Level ",s.level]}),e.jsx("td",{style:{padding:"8px 12px"},children:e.jsx("code",{children:s.z})}),e.jsx("td",{style:{padding:"8px 12px"},children:s.use})]},s.level))})]})})};var i,d,n;l.parameters={...l.parameters,docs:{...(i=l.parameters)==null?void 0:i.docs,source:{originalSource:`{
  render: () => <Section title="Elevation Scale">\r
      <p style={{
      fontSize: '14px',
      color: '#666',
      marginBottom: '24px'
    }}>\r
        Progressive shadow depth for visual hierarchy. Higher levels indicate elements closer to the\r
        user in z-space.\r
      </p>\r
      <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '24px'
    }}>\r
        {elevations.map(s => <div key={s.cssVar}>\r
            <ShadowCard name={s.name} cssVar={s.cssVar} value={s.value} />\r
            <div style={{
          fontSize: '12px',
          color: '#666',
          maxWidth: '160px',
          textAlign: 'center'
        }}>\r
              {s.usage}\r
            </div>\r
          </div>)}\r
      </div>\r
    </Section>
}`,...(n=(d=l.parameters)==null?void 0:d.docs)==null?void 0:n.source}}};var p,c,x;o.parameters={...o.parameters,docs:{...(p=o.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: () => <Section title="Special Shadows">\r
      <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '32px'
    }}>\r
        <div>\r
          <div style={{
          width: '200px',
          height: '44px',
          borderRadius: '8px',
          border: '2px solid #0066CC',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: specialShadows[0].value,
          fontSize: '14px',
          fontWeight: 500
        }}>\r
            Focus Ring\r
          </div>\r
          <code style={{
          fontSize: '11px',
          color: '#666',
          display: 'block',
          marginTop: '8px'
        }}>\r
            {specialShadows[0].cssVar}\r
          </code>\r
          <div style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '2px'
        }}>\r
            {specialShadows[0].usage}\r
          </div>\r
        </div>\r
\r
        <div>\r
          <button style={{
          width: '200px',
          height: '40px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#0066CC',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: specialShadows[1].value,
          cursor: 'pointer'
        }}>\r
            Active / Pressed\r
          </button>\r
          <code style={{
          fontSize: '11px',
          color: '#666',
          display: 'block',
          marginTop: '8px'
        }}>\r
            {specialShadows[1].cssVar}\r
          </code>\r
          <div style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '2px'
        }}>\r
            {specialShadows[1].usage}\r
          </div>\r
        </div>\r
      </div>\r
    </Section>
}`,...(x=(c=o.parameters)==null?void 0:c.docs)==null?void 0:x.source}}};var h,v,g;t.parameters={...t.parameters,docs:{...(h=t.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <Section title="Shadow Usage Guidelines">\r
      <table style={{
      borderCollapse: 'collapse',
      width: '100%',
      fontSize: '14px'
    }}>\r
        <thead>\r
          <tr style={{
          borderBottom: '2px solid #e5e5e5'
        }}>\r
            <th style={{
            textAlign: 'left',
            padding: '8px 12px'
          }}>Level</th>\r
            <th style={{
            textAlign: 'left',
            padding: '8px 12px'
          }}>z-index Range</th>\r
            <th style={{
            textAlign: 'left',
            padding: '8px 12px'
          }}>Use Case</th>\r
          </tr>\r
        </thead>\r
        <tbody>\r
          {[{
          level: '0',
          z: '0',
          use: 'Inline elements, no elevation needed'
        }, {
          level: '1',
          z: '1–10',
          use: 'Cards, list items, subtle elevation'
        }, {
          level: '2',
          z: '10–100',
          use: 'Dropdowns, popovers, menus'
        }, {
          level: '3',
          z: '100–1000',
          use: 'Modals, drawers, overlays'
        }, {
          level: '4',
          z: '1000–5000',
          use: 'Tooltips stacked on modals'
        }, {
          level: '5',
          z: '5000+',
          use: 'Critical alerts, emergency banners'
        }].map(row => <tr key={row.level} style={{
          borderBottom: '1px solid #f0f0f0'
        }}>\r
              <td style={{
            padding: '8px 12px',
            fontWeight: 600
          }}>Level {row.level}</td>\r
              <td style={{
            padding: '8px 12px'
          }}><code>{row.z}</code></td>\r
              <td style={{
            padding: '8px 12px'
          }}>{row.use}</td>\r
            </tr>)}\r
        </tbody>\r
      </table>\r
    </Section>
}`,...(g=(v=t.parameters)==null?void 0:v.docs)==null?void 0:g.source}}};const w=["ElevationScale","SpecialShadows","UsageGuidelines"];export{l as ElevationScale,o as SpecialShadows,t as UsageGuidelines,w as __namedExportsOrder,b as default};
