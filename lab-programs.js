// Original reference solutions to the exercises in 03-DSD Lab Manual -2024.pdf.
// Printed page numbers, not PDF page numbers. No third-party manual is redistributed.
// Each entry is self-contained: design.v + testbench.v, with no include files.
export const labTitles = ['Introduction to Verilog and K-map','Multilevel synthesis and arithmetic circuits','Multiplexers, comparators and code converters','Decoders and encoders','Multiplexer and decoder applications','Flip-flops','Registers','Sequential circuits','Counters','Non-binary counters'];
export const labPrograms = [];
function add(lab, question, title, page, design, declarations, connection, stimulus, notes = '', clock = '') {
  const id = `lab${lab}-${question.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
  const names = [...design.matchAll(/\bmodule\s+(\w+)/g)].map(m=>m[1]);
  for (const name of names) {
    const re = new RegExp(`\\b${name}\\b`, 'g');
    design = design.replace(re, `${id.replaceAll('-','_')}_${name}`);
    connection = connection.replace(re, `${id.replaceAll('-','_')}_${name}`);
  }
  const category = question.startsWith('S') ? 'Solved' : question.startsWith('A') ? 'Additional' : 'Lab exercise';
  labPrograms.push({id,lab,question,category,page,name:`Lab ${lab} · ${question} — ${title}`,title,
    explanation:`${notes} Reference solution; manual printed page ${page||'iii'}.`,
    design:`// Lab ${lab}, ${question}: ${title}\n// ${notes}\n${design.trim()}\n`,
    testbench:'`timescale 1ns/1ps\nmodule tb;\n'+declarations+'\n  integer i;\n  '+connection+'\n'+clock+'\n  initial begin\n    $dumpfile("signal.vcd");\n    $dumpvars(0, tb);\n'+stimulus+'\n    $display("PASS: '+id+'");\n    $finish;\n  end\nendmodule\n'});
}
function comb(lab,q,title,page,ports,body,decl,conn,stim,notes='',helpers='') {
  add(lab,q,title,page,`module circuit (${ports});\n${body}\nendmodule\n${helpers}`,decl,`circuit dut (${conn});`,stim,notes);
}
const check=(condition)=>`if (${condition}) $fatal(1, "Output mismatch at vector %0d", i);`;
const all=(count,inputs,condition)=>`    for (i=0; i<${count}; i=i+1) begin\n      ${inputs}=i; #2;\n      ${check(condition)}\n    end`;
const mask=(ones,n=16)=>`${n}'h${ones.reduce((x,i)=>x|2**i,0).toString(16)}`;
// Exact minimal two-level cover, computed once for four-variable K-map exercises.
function cover(ones,dc=[],pos=false) {
  const allowed=new Set([...ones,...dc]), patterns=[];
  for(let code=0;code<81;code++){
    let n=code,p=[];for(let i=0;i<4;i++){p.unshift(n%3);n=Math.floor(n/3);}
    const hits=Array.from({length:16},(_,i)=>i).filter(i=>p.every((v,b)=>v===2||v===((i>>(3-b))&1)));
    if(hits.some(i=>!allowed.has(i)))continue;
    const bits=ones.reduce((m,i,j)=>m|(hits.includes(i)?1<<j:0),0);
    if(bits)patterns.push({p,bits,cost:p.filter(v=>v!==2).length+1});
  }
  const best=new Map([[0,{cost:0,terms:[]}]]), full=(1<<ones.length)-1;
  for(let m=0;m<=full;m++)if(best.has(m))for(const t of patterns){const v=m|t.bits,a=best.get(m);if(v!==m&&(!best.has(v)||best.get(v).cost>a.cost+t.cost))best.set(v,{cost:a.cost+t.cost,terms:[...a.terms,t.p]});}
  return best.get(full).terms.map(p=>'('+p.map((v,i)=>v===2?'':((pos?v===1:v===0)?'~':'')+'abcd'[i]).filter(Boolean).join(pos?' | ':' & ')+')').join(pos?' & ':' | ');
}
const gates=`module fa(input a,b,cin, output sum,cout);\n  assign sum=a^b^cin; assign cout=(a&b)|(cin&(a^b));\nendmodule`;
const mux2=`module mux2(input a,b,s, output y); assign y=s?b:a; endmodule`;
const mux4=`module mux4(input [3:0] d,input [1:0] s,output y); assign y=d[s]; endmodule`;
const mux8=`module mux8(input [7:0] d,input [2:0] s,output reg y);\n  always @* case(s)\n    0:y=d[0]; 1:y=d[1]; 2:y=d[2]; 3:y=d[3];\n    4:y=d[4]; 5:y=d[5]; 6:y=d[6]; 7:y=d[7];\n    default:y=1'bx;\n  endcase\nendmodule`;
const dec2=`module dec2(input [1:0] a,input en,output [3:0] y); assign y=en?(4'b1<<a):4'b0; endmodule`;
const dff=`module dff(input clk,rst,d,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=d; endmodule`;
const jkff=`module jkff(input clk,rst,j,k,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(j&~q)|(~k&q); endmodule`;
const tff=`module tff(input clk,rst,t,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=q^t; endmodule`;
const srff=`module srff(input clk,rst,s,r,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else case({s,r}) 0:q<=q; 1:q<=0; 2:q<=1; 3:q<=1'bx; endcase endmodule`;

// LAB 1 — includes the introductory sample, both styles, and the solved K-map.
for(const [q,title,body,page] of [
  ['S1','Continuous-assignment sample','assign f=(a&b)|(~b&c);',0],
  ['S2','Structural gate sample','wire g,h,k; and(g,a,b); not(k,b); and(h,k,c); or(f,g,h);',8],
  ['S3','Behavioral expression as printed','assign f=(a&b)|(b&c);',11]])
  comb(1,q,title,page,'input a,b,c,output f',body,'reg a,b,c; wire f;','a,b,c,f',all(8,'{a,b,c}',`f !== ${q==='S3'?'((a&b)|(b&c))':'((a&b)|(~b&c))'}`),q==='S3'?'The expression on page 11 omits the NOT on b; it differs from the earlier structural sample.':'Exhaustive eight-vector test.');
for(const [q,title,ones,dc,pos,page] of [
  ['S4','Solved K-map with don’t-cares',[2,4,5,6,10],[12,13,14,15],false,12],
  ['Q1a','SOP K-map',[0,1,2,3,4,8,9,12],[],false,13],
  ['Q1b','SOP K-map with don’t-cares',[0,4,6,7,10,12,14],[2,13],false,13],
  ['Q2a','POS K-map',[0,1,4,8,9,12,15],[],true,13],
  ['Q2b','POS K-map with don’t-cares',[2,5,6,8,10],[9,12,14],true,13]]) {
  const expr=cover(ones,dc,pos), vars='abcd', literals=new Set(expr.match(/~?[abcd]/g));
  let body=[...literals].filter(s=>s.startsWith('~')).map(s=>`wire n${s[1]}; not(n${s[1]},${s[1]});`).join('\n');
  const terms=expr.split(pos?' & ':' | ').map(s=>s.replace(/[()]/g,''));
  // Split only at top-level parentheses; terms themselves contain the other operator.
  const groups=[...expr.matchAll(/\(([^)]+)\)/g)].map(m=>m[1]);
  body+='\nwire '+groups.map((_,i)=>'t'+i).join(',')+';\n';
  groups.forEach((g,i)=>body+=`${pos?'or':'and'}(t${i},${g.split(pos?' | ':' & ').map(s=>s.replace('~','n')).join(',')});\n`);
  body+=`${pos?'and':'or'}(f,${groups.map((_,i)=>'t'+i).join(',')});`;
  const values=pos?Array.from({length:16},(_,i)=>i).filter(i=>!ones.includes(i)&&!dc.includes(i)):ones;
  comb(1,q,title,page,'input a,b,c,d,output f',body,`reg a,b,c,d; wire f; localparam [15:0] EXPECT=${mask(values)}, CARE=~${mask(dc)};`,'a,b,c,d,f',all(16,'{a,b,c,d}',"CARE[i] && f !== EXPECT[i]"),`Minimum two-level ${pos?'POS':'SOP'}: ${expr}. Don’t-care input rows are not asserted by the testbench.`);
}
comb(1,'A1','Compare two Boolean functions',13,'input a,b,c,output f1,f2,equal','assign f1=(a&~c)|(b&c)|(~b&~c);\nassign f2=(a|~b|c)&(a|b|~c)&(~a|b|~c); assign equal=(f1==f2);','reg a,b,c; wire f1,f2,equal;','a,b,c,f1,f2,equal',all(8,'{a,b,c}','f1 !== ((a&~c)|(b&c)|(~b&~c)) || f2 !== ((a|~b|c)&(a|b|~c)&(~a|b|~c))'),'Not equivalent: a=b=c=0 gives f1=1 and f2=0.');
comb(1,'A2','At least three of four inputs',13,'input [3:0] x,output f','assign f=(x[3]&x[2]&x[1])|(x[3]&x[2]&x[0])|(x[3]&x[1]&x[0])|(x[2]&x[1]&x[0]);','reg [3:0] x; wire f; integer total;','x,f',`for(i=0;i<16;i=i+1) begin x=i; #2; total=(i>>3)+((i>>2)&1)+((i>>1)&1)+(i&1); ${check('f !== (total>=3)')} end`);

// LAB 2
comb(2,'S1','Factored XOR-controlled function',15,'input a,b,c,d,output f','wire g; assign g=a^b; assign f=(g&c)|(~g&d);','reg a,b,c,d; wire f;','a,b,c,d,f',all(16,'{a,b,c,d}','f !== ((a^b)?c:d)'),'g=a XOR b; f=g·c + g′·d.');
comb(2,'Q1','Functional decomposition',15,'input a,b,c,d,output f','wire g,h; assign g=a&b; assign h=c|d;\nassign f=(~g&~h)|(g&h);','reg a,b,c,d; wire f; localparam [15:0] EXPECT=16\'he111;','a,b,c,d,f',all(16,'{a,b,c,d}','f !== EXPECT[i]'),'For minterms 0,4,8,13,14,15: let g=ab and h=c+d, then f=g XNOR h.');
comb(2,'Q2','Behavioral full adder',15,'input a,b,cin,output reg sum,cout','always @* {cout,sum}={1\'b0,a}+{1\'b0,b}+cin;','reg a,b,cin; wire sum,cout; integer expected;','a,b,cin,sum,cout',`for(i=0;i<8;i=i+1) begin {a,b,cin}=i; #2; expected=(i>>2)+((i>>1)&1)+(i&1); ${check('{cout,sum} !== expected[1:0]')} end`);
comb(2,'Q3','4-bit adder/subtractor',15,'input [3:0] a,b,input sub,output reg [3:0] result,output reg cout','always @* {cout,result}={1\'b0,a}+{1\'b0,(b^{4{sub}})}+sub;','reg [3:0] a,b; reg sub; wire [3:0] result; wire cout; reg [4:0] expected;','a,b,sub,result,cout',`for(i=0;i<512;i=i+1) begin {sub,a,b}=i; expected={1'b0,a}+{1'b0,(b^{4{sub}})}+sub; #1; ${check('{cout,result} !== expected')} end`,'sub=0 adds, sub=1 computes A + ~B + 1. For subtraction, cout=1 means no borrow.');
comb(2,'Q4','3×3 multiplier from gates and adders',15,'input [2:0] a,b,output [5:0] p',`wire [5:0] r0,r1,r2,s; wire [6:0] c0,c1;
assign r0={3'b0,a&{3{b[0]}}}; assign r1={2'b0,a&{3{b[1]}},1'b0}; assign r2={1'b0,a&{3{b[2]}},2'b0};
assign c0[0]=0; assign c1[0]=0;
genvar k; generate for(k=0;k<6;k=k+1) begin: stages
fa u0(r0[k],r1[k],c0[k],s[k],c0[k+1]); fa u1(s[k],r2[k],c1[k],p[k],c1[k+1]); end endgenerate`, 'reg [2:0] a,b; wire [5:0] p; reg [5:0] expected;','a,b,p',`for(i=0;i<64;i=i+1) begin {a,b}=i; expected=a*b; #2; ${check('p !== expected')} end`,'Partial products are AND gates; two ripple-adder stages combine them.',gates);
const bcdDigit=`module bcd_digit(input [3:0] a,b,input cin,output [3:0] s,output cout); wire [4:0] raw,corrected; assign raw={1'b0,a}+{1'b0,b}+cin; assign cout=raw>9; assign corrected=raw+(cout?5'd6:5'd0); assign s=corrected[3:0]; endmodule`;
comb(2,'A1','Two-digit BCD adder',16,'input [7:0] a,b,output [7:0] sum,output cout','wire carry; bcd_digit lo(a[3:0],b[3:0],1\'b0,sum[3:0],carry); bcd_digit hi(a[7:4],b[7:4],carry,sum[7:4],cout);','reg [7:0] a,b; wire [7:0] sum; wire cout; integer j,expected;','a,b,sum,cout',`for(i=0;i<100;i=i+1) for(j=0;j<100;j=j+1) begin a=((i/10)<<4)|(i%10); b=((j/10)<<4)|(j%10); expected=i+j; #0.01; if (100*cout+10*sum[7:4]+sum[3:0] != expected) $fatal(1,"BCD addition failed"); end`,'Only valid BCD digits are inputs. cout is the hundreds digit. Tests every 00–99 pair.',bcdDigit);
comb(2,'A2','Logic operations using full adders',16,'input a,b,output and_y,nand_y,nor_y,or_y,xor_y,xnor_y',`wire unused,unused2,unused3,unused4;
fa u0(a,b,1'b0,xor_y,and_y); fa u1(a,b,1'b1,xnor_y,or_y);
fa u2(and_y,1'b0,1'b1,nand_y,unused); fa u3(or_y,1'b0,1'b1,nor_y,unused2);`,'reg a,b; wire and_y,nand_y,nor_y,or_y,xor_y,xnor_y;','a,b,and_y,nand_y,nor_y,or_y,xor_y,xnor_y',all(4,'{a,b}','{and_y,nand_y,nor_y,or_y,xor_y,xnor_y} !== {(a&b),~(a&b),~(a|b),(a|b),(a^b),~(a^b)}'),'cin=0 gives XOR and AND; cin=1 gives XNOR and OR. Two more full adders invert carry outputs.',gates);

// LAB 3
comb(3,'S1','2:1 mux using always and conditional',20,'input a,b,s,output reg y','always @* y=s?b:a;','reg a,b,s; wire y;','a,b,s,y',all(8,'{a,b,s}','y !== (s?b:a)'));
comb(3,'Q1','4:1 mux with if–else',22,'input [3:0] d,input [1:0] s,output reg y','always @* if(s==0) y=d[0]; else if(s==1) y=d[1]; else if(s==2) y=d[2]; else y=d[3];','reg [3:0] d; reg [1:0] s; wire y;','d,s,y',all(64,'{d,s}','y !== d[s]'));
comb(3,'Q2a','8:1 mux with case',22,'input [7:0] d,input [2:0] s,output y','mux8 m(d,s,y);','reg [7:0] d; reg [2:0] s; wire y;','d,s,y',`for(i=0;i<256;i=i+1) begin d=i; s=i%8; #2; ${check('y !== d[s]')} end`,'The 8:1 building block used in Q2b.',mux8);
comb(3,'Q2b','Hierarchical 16:1 mux',22,'input [15:0] d,input [3:0] s,output y','wire lo,hi; mux8 m0(d[7:0],s[2:0],lo); mux8 m1(d[15:8],s[2:0],hi); mux2 m2(lo,hi,s[3],y);','reg [15:0] d; reg [3:0] s; wire y; integer j;','d,s,y',`for(i=0;i<16;i=i+1) for(j=0;j<16;j=j+1) begin d=16'b1<<i; s=j; #2; ${check('y !== d[s]')} end`,'Two 8:1 multiplexers feed one 2:1 multiplexer.',mux8+'\n'+mux2);
comb(3,'Q3','3-bit comparator using logic equations',22,'input [2:0] a,b,output reg gt,eq,lt',`reg [2:0] e; always @* begin e=~(a^b); eq=&e;
gt=(a[2]&~b[2])|(e[2]&a[1]&~b[1])|(e[2]&e[1]&a[0]&~b[0]);
lt=(~a[2]&b[2])|(e[2]&~a[1]&b[1])|(e[2]&e[1]&~a[0]&b[0]); end`,'reg [2:0] a,b; wire gt,eq,lt;','a,b,gt,eq,lt',all(64,'{a,b}','{gt,eq,lt} !== {(a>b),(a==b),(a<b)}'),'Behavioral description uses only bitwise gate equations, not comparison operators.');
add(3,'Q4','N-bit binary to Gray using for loop',22,`module circuit #(parameter N=4)(input [N-1:0] binary,output reg [N-1:0] gray); integer k; always @* begin gray[N-1]=binary[N-1]; for(k=0;k<N-1;k=k+1) gray[k]=binary[k+1]^binary[k]; end endmodule`,'reg [3:0] binary; wire [3:0] gray;','circuit dut(binary,gray);',all(16,'binary','gray !== (binary^(binary>>1))'),'N defaults to 4; top Gray bit equals top binary bit.');
comb(3,'A1','BCD to excess-3, K-map equations',22,'input a,b,c,d,output [3:0] e',`assign e[3]=a|(b&c)|(b&d); assign e[2]=(~b&(c|d))|(b&~c&~d); assign e[1]=~(c^d); assign e[0]=~d;`,'reg a,b,c,d; wire [3:0] e;','a,b,c,d,e',all(10,'{a,b,c,d}','e !== (i+3)'),'Valid inputs 0–9; 10–15 are don’t-cares in minimization.');
comb(3,'A2','4-bit comparator from 2-bit comparators',22,'input [3:0] a,b,output gt,eq,lt','wire gh,eh,lh,gl,el,ll; cmp2 hi(a[3:2],b[3:2],gh,eh,lh); cmp2 lo(a[1:0],b[1:0],gl,el,ll); assign gt=gh|(eh&gl); assign eq=eh&el; assign lt=lh|(eh&ll);','reg [3:0] a,b; wire gt,eq,lt;','a,b,gt,eq,lt',all(256,'{a,b}','{gt,eq,lt} !== {(a>b),(a==b),(a<b)}'),'',`module cmp2(input [1:0] a,b,output gt,eq,lt); assign gt=a>b; assign eq=a==b; assign lt=a<b; endmodule`);

// LAB 4
comb(4,'S1','2:4 decoder using for loop',24,'input [1:0] a,input en,output reg [3:0] y','integer k; always @* for(k=0;k<4;k=k+1) y[k]=en&&(a==k);','reg [1:0] a; reg en; wire [3:0] y;','a,en,y',all(8,'{en,a}',"y !== (en?(4'b1<<a):4'b0)"),'Output y[k] is high for address k.');
const declow=`module declow(input [1:0] a,input en_n,output reg [3:0] y); always @* begin y=0; if(!en_n) begin if(a==0)y=1; else if(a==1)y=2; else if(a==2)y=4; else y=8; end end endmodule`;
comb(4,'Q1','2:4 decoder, active-low enable',26,'input [1:0] a,input en_n,output [3:0] y','declow d(a,en_n,y);','reg [1:0] a; reg en_n; wire [3:0] y;','a,en_n,y',all(8,'{en_n,a}',"y !== (en_n?4'b0:(4'b1<<a))"),'Active-high outputs; if–else building block.',declow);
comb(4,'Q2','4:16 decoder from Q1 blocks',26,'input [3:0] a,input en,output [15:0] y','wire [3:0] bank; declow top(a[3:2],~en,bank); genvar k; generate for(k=0;k<4;k=k+1) begin:b declow leaf(a[1:0],~bank[k],y[4*k+:4]); end endgenerate','reg [3:0] a; reg en; wire [15:0] y;','a,en,y',all(32,'{en,a}',"y !== (en?(16'b1<<a):16'b0)"),'Five active-low-enable 2:4 blocks make an active-high-enable decoder.',declow);
comb(4,'Q3','4:2 priority encoder with casex',26,'input [3:0] d,output reg [1:0] code,output reg valid',`always @* begin valid=1; casex(d) 4'b1xxx:code=3; 4'b01xx:code=2; 4'b001x:code=1; 4'b0001:code=0; default:begin code=0; valid=0; end endcase end`,'reg [3:0] d; wire [1:0] code; wire valid; reg [1:0] expected; integer k;','d,code,valid',`for(i=0;i<16;i=i+1) begin d=i; expected=0; for(k=0;k<4;k=k+1) if(d[k])expected=k; #2; ${check('code !== expected || valid !== (d!=0)')} end`,'Highest input bit has priority. casex is required by the sheet but can hide X/Z errors; only binary vectors are tested.');
comb(4,'Q4','16:4 priority encoder with for loop',26,'input [15:0] d,output reg [3:0] code,output reg valid','integer k; always @* begin code=0; valid=0; for(k=0;k<16;k=k+1) if(d[k]) begin code=k; valid=1; end end','reg [15:0] d; wire [3:0] code; wire valid;','d,code,valid',`d=0; #2; if(valid!==0)$fatal; for(i=0;i<16;i=i+1) begin d=(32'b1<<(i+1))-1; #2; ${check('code !== i[3:0] || valid !== 1')} end`,'Later loop iterations override earlier ones: bit 15 has highest priority.');
const deccase=`module deccase(input [1:0] a,input en,output reg [3:0] y); always @* begin y=0; if(en) case(a) 0:y=1; 1:y=2; 2:y=4; 3:y=8; default:y=0; endcase end endmodule`;
comb(4,'A1a','Active-high 2:4 decoder with case',26,'input [1:0] a,input en,output [3:0] y','deccase d(a,en,y);','reg [1:0] a; reg en; wire [3:0] y;','a,en,y',all(8,'{en,a}',"y !== (en?(4'b1<<a):4'b0)"),'Building block for A1b.',deccase);
comb(4,'A1b','4:16 decoder, active-low enable',26,'input [3:0] a,input en_n,output [15:0] y','wire [3:0] bank; deccase top(a[3:2],~en_n,bank); genvar k; generate for(k=0;k<4;k=k+1) begin:b deccase leaf(a[1:0],bank[k],y[4*k+:4]); end endgenerate','reg [3:0] a; reg en_n; wire [15:0] y;','a,en_n,y',all(32,'{en_n,a}',"y !== (en_n?16'b0:(16'b1<<a))"),'Active-high outputs.',deccase);
const dec3low=`module dec3low(input [2:0] a,input en,output reg [7:0] y); always @* begin y=8'hff; if(en) begin if(a==0)y=8'hfe; else if(a==1)y=8'hfd; else if(a==2)y=8'hfb; else if(a==3)y=8'hf7; else if(a==4)y=8'hef; else if(a==5)y=8'hdf; else if(a==6)y=8'hbf; else y=8'h7f; end end endmodule`;
comb(4,'A2a','3:8 decoder, active-low outputs',26,'input [2:0] a,input en,output [7:0] y','dec3low d(a,en,y);','reg [2:0] a; reg en; wire [7:0] y;','a,en,y',all(16,'{en,a}',"y !== (en?~(8'b1<<a):8'hff)"),'Active-high enable, if–else implementation.',dec3low);
comb(4,'A2b','5:32 decoder tree, active-low outputs',26,'input [4:0] a,input en,output [31:0] y','wire [3:0] bank; dec2 top(a[4:3],en,bank); genvar k; generate for(k=0;k<4;k=k+1) begin:b dec3low leaf(a[2:0],bank[k],y[8*k+:8]); end endgenerate','reg [4:0] a; reg en; wire [31:0] y;','a,en,y',all(64,'{en,a}',"y !== (en?~(32'b1<<a):32'hffffffff)"),'One 2:4 and four 3:8 decoders.',dec2+'\n'+dec3low);

// LAB 5
comb(5,'S1','XOR using a 2:1 mux',28,'input a,b,output y','mux2 m(b,~b,a,y);','reg a,b; wire y;','a,b,y',all(4,'{a,b}','y !== (a^b)'),'Corrected the solved example’s inconsistent module name.',mux2);
comb(5,'Q1','Minterm function using 4:1 mux',29,'input a,b,c,d,output f','wire [3:0] data; assign data={~d,(~c&d),~d,(~c|~d)}; mux4 m(data,{a,b},f);','reg a,b,c,d; wire f; localparam [15:0] EXPECT=16\'h5257;','a,b,c,d,f',all(16,'{a,b,c,d}','f !== EXPECT[i]'),'Select AB; I0=C′+D′, I1=D′, I2=C′D, I3=D′. Minterms 0,1,2,4,6,9,12,14.',mux4);
comb(5,'Q2','4-bit Gray to binary using 8:1 muxes',29,'input [3:0] g,output [3:0] b',`assign b[3]=g[3];
mux8 u2({4{~g[2],g[2]}},{2'b0,g[3]},b[2]);
mux8 u1(8'b10010110,g[3:1],b[1]);
mux8 u0({~g[0],g[0],g[0],~g[0],g[0],~g[0],~g[0],g[0]},g[3:1],b[0]);`,'reg [3:0] g; wire [3:0] b;','g,b',all(16,'g','b !== {g[3],(g[3]^g[2]),(g[3]^g[2]^g[1]),(^g)}'),'Each binary bit is the XOR of Gray bits from the MSB down to that bit.',mux8);
comb(5,'Q3','Minterm function using 4:16 decoder',29,'input [3:0] a,output f',`wire [15:0] y; assign y=16'b1<<a; or(f,y[2],y[3],y[4],y[5],y[6],y[7],y[10],y[11],y[12],y[15]);`,'reg [3:0] a; wire f; localparam [15:0] EXPECT=16\'h9cfc;','a,f',all(16,'a','f !== EXPECT[i]'),'One-hot decoder outputs for minterms 2,3,4,5,6,7,10,11,12,15 feed the OR gate.');
comb(5,'Q4','Three-input majority using decoder',29,'input a,b,c,output f','wire [3:0] y; dec2 d({a,b},1\'b1,y); assign f=y[3]|(c&(y[1]|y[2]));','reg a,b,c; wire f;','a,b,c,f',all(8,'{a,b,c}','f !== ((a&b)|(a&c)|(b&c))'),'',dec2);
// Build each 2421 output as four Shannon cofactors in C,D, selected by A,B.
const code2421=[0,1,2,3,4,11,12,13,14,15];
let b2421='wire [3:0] data0,data1,data2,data3;\n';
for(let bit=0;bit<4;bit++){
  const groups=[];for(let group=0;group<4;group++) {const terms=[];for(let cd=0;cd<4;cd++){const n=group*4+cd;if(n<10&&((code2421[n]>>bit)&1))terms.push(`(${cd&2?'c':'~c'} & ${cd&1?'d':'~d'})`);} groups.push(terms.join(' | ')||"1'b0");}
  b2421+=groups.map((e,i)=>`assign data${bit}[${i}]=${e};`).join('\n')+`\nmux4 m${bit}(data${bit},{a,b},y[${bit}]);\n`;
}
comb(5,'A1','BCD to Aiken 2421 using 4:1 muxes',29,'input a,b,c,d,output [3:0] y',b2421,"reg a,b,c,d; wire [3:0] y; reg [3:0] expected [0:9];",'a,b,c,d,y',code2421.map((v,i)=>`expected[${i}]=4'd${v};`).join('\n')+'\n'+all(10,'{a,b,c,d}','y !== expected[i]'),'Aiken mapping 0,1,2,3,4,B,C,D,E,F. Invalid BCD inputs produce 0000.',mux4);
comb(5,'A2','Full adder using decoders',29,'input a,b,cin,output sum,cout','wire [3:0] y; dec2 d({a,b},1\'b1,y); assign sum=(~cin&(y[1]|y[2]))|(cin&(y[0]|y[3])); assign cout=y[3]|(cin&(y[1]|y[2]));','reg a,b,cin; wire sum,cout; reg [1:0] expected;','a,b,cin,sum,cout',`for(i=0;i<8;i=i+1) begin {a,b,cin}=i; expected={1'b0,a}+{1'b0,b}+cin; #2; ${check('{cout,sum} !== expected')} end`,'A 2:4 decoder expands AB; gates incorporate carry-in.',dec2);

// LAB 6 — exact reset polarity and clock edge required by each question.
function flip(q,title,type,edge,async,low,page=33){
  const inputs=type==='jk'?'j,k':type==='sr'?'s,r':type==='t'?'t':'d', reset=low?'!rst':'rst';
  const op=type==='d'?'q<=d;':type==='t'?'q<=q^t;':type==='jk'?'q<=(j&~q)|(~k&q);':"case({s,r}) 0:q<=q; 1:q<=0; 2:q<=1; 3:q<=1'bx; endcase";
  const action=type==='d'?'expected=d;':type==='t'?'expected=expected^t;':type==='jk'?'expected=(j&~expected)|(~k&expected);':"case({s,r}) 0:expected=expected; 1:expected=0; 2:expected=1; 3:expected=1'bx; endcase";
  add(6,q,title,page,`module circuit(input clk,rst,${inputs},output reg q); always @(${edge} clk${async?' or '+(low?'negedge':'posedge')+' rst':''}) if(${reset}) q<=0; else ${op} endmodule`,
    `reg clk=${edge==='posedge'?0:1},rst=${low?1:0},${inputs.split(',').map(s=>s+'=0').join(',')}; wire q; reg expected;`,
    `circuit dut(clk,rst,${inputs},q);`,
    `rst=${low?0:1}; #2; ${async?'if(q!==0)$fatal(1,"Async reset failed");':''} @(${edge} clk); #1; if(q!==0)$fatal(1,"Reset failed"); expected=0;
    @(${edge==='posedge'?'negedge':'posedge'} clk); rst=${low?1:0};
    for(i=0;i<12;i=i+1) begin {${inputs}}=i; ${action} @(${edge} clk); #1; if(q!==expected)$fatal(1,"Flip-flop mismatch"); @(${edge==='posedge'?'negedge':'posedge'} clk); end`,
    `${async?'Asynchronous':'Synchronous'} active-${low?'low':'high'} reset; ${edge==='posedge'?'rising':'falling'} clock edge.${type==='sr'?' S=R=1 is forbidden and modeled as X, not a usable hardware state.':''}`, 'always #5 clk=~clk;');
}
flip('S1','D flip-flop, synchronous active-low reset','d','posedge',false,true,31);
flip('Q1','D flip-flop, synchronous active-high reset','d','posedge',false,false);
flip('Q2','T flip-flop, synchronous active-low reset','t','negedge',false,true);
flip('Q3','JK flip-flop, asynchronous active-high reset','jk','posedge',true,false);
flip('Q4','SR flip-flop, asynchronous active-low reset','sr','negedge',true,true);
flip('A1','T flip-flop, synchronous active-high reset','t','negedge',false,false);
flip('A2','JK flip-flop, asynchronous active-low reset','jk','posedge',true,true);

// LAB 7
function register(q,title,n,body,notes,page,helpers='',ports='input serial',init='serial=0;',drive='serial=i;',expected=`expected={expected[${n-2}:0],serial};`){
 add(7,q,title,page,`module circuit(input clk,rst,${ports},output ${body.includes('always')?'reg ':''}[${n-1}:0] q);\n${body}\nendmodule\n${helpers}`,`reg clk=0,rst=0; ${ports.includes('mode')?'reg [1:0] mode; reg [3:0] data; reg serial;':ports.includes('data')?`reg [${n-1}:0] data;`:'reg serial;'} wire [${n-1}:0] q; reg [${n-1}:0] expected;`, `circuit dut(clk,rst,${ports.includes('mode')?'mode,data,serial':ports.includes('data')?'data':'serial'},q);`,
 `${init} rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0;
 for(i=0;i<20;i=i+1) begin @(negedge clk); ${drive} ${expected} @(posedge clk); #1; if(q!==expected)$fatal(1,"Register mismatch"); end`,notes+' An active-high asynchronous reset is added to initialize simulation.','always #5 clk=~clk;');
}
register('S1','Structural 4-bit register',4,'genvar k; generate for(k=0;k<4;k=k+1) begin:b dff f(clk,rst,data[k],q[k]); end endgenerate','Four D flip-flops.',36,dff,'input [3:0] data','data=0;','data=i;','expected=data;');
register('Q1','Structural 6-bit shift register',6,'dff first(clk,rst,serial,q[0]); genvar k; generate for(k=1;k<6;k=k+1) begin:b dff f(clk,rst,q[k-1],q[k]); end endgenerate','Shift toward MSB; serial enters q[0], serial output is q[5].',37,dff);
add(7,'Q2','N-bit parallel register',37,`module circuit #(parameter N=8)(input clk,rst,input [N-1:0] d,output reg [N-1:0] q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=d; endmodule`,'reg clk=0,rst=0; reg [7:0] d=0; wire [7:0] q;','circuit dut(clk,rst,d,q);',`rst=1; #2; if(q!==0)$fatal; #5; rst=0; for(i=0;i<256;i=i+1) begin @(negedge clk); d=i; @(posedge clk); #0.1; if(q!==d)$fatal; end`,'N defaults to 8; testbench width must match N. Added reset for deterministic initialization.','always #1 clk=~clk;');
for(const [q,additional,page] of [['Q3',false,37],['A2',true,38]]) register(q,additional?'Shift/parallel load/hold register':'Shift/load/complement/hold register',4,`always @(posedge clk or posedge rst) if(rst)q<=0; else case(mode) 0:q<={q[2:0],serial}; 1:q<=data; 2:q<=${additional?'q':'~q'}; 3:q<=q; endcase`, `mode={Shift,Load}: 00 shifts left, 01 loads, ${additional?'1X holds':'10 complements, 11 holds'}.`,page,'','input [1:0] mode,input [3:0] data,input serial','mode=0; data=0; serial=0;','mode=i%4; data=i; serial=i%2;',`case(mode) 0:expected={expected[2:0],serial}; 1:expected=data; 2:expected=${additional?'expected':'~expected'}; 3:expected=expected; endcase`);
add(7,'A1','N-bit shift register',38,`module circuit #(parameter N=8)(input clk,rst,serial,output reg [N-1:0] q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(q<<1)|serial; endmodule`,'reg clk=0,rst=0,serial=0; wire [7:0] q; reg [7:0] expected;','circuit dut(clk,rst,serial,q);',`rst=1; #2; #5; rst=0; expected=0; for(i=0;i<24;i=i+1) begin @(negedge clk); serial=i%3==0; expected=(expected<<1)|serial; @(posedge clk); #1; if(q!==expected)$fatal; end`,'N defaults to 8; shifts toward MSB. Asynchronous reset added.','always #5 clk=~clk;');

// Common sequential solution: next-state logic driving explicit requested flip-flops.
function fsm(lab,q,title,page,n,type,nextLogic,output='',extraPorts='',decl='',conn='',drive='',reference='',notes='',initialState=0){
 const helper=type==='jk'?jkff:type==='t'?tff:type==='sr'?srff:dff;
 const instance=type==='jk'?'jkff ff(clk,rst,(~q[k]&next[k]),(q[k]&~next[k]),q[k]);':type==='t'?'tff ff(clk,rst,(q[k]^next[k]),q[k]);':type==='sr'?'srff ff(clk,rst,(~q[k]&next[k]),(q[k]&~next[k]),q[k]);':'dff ff(clk,rst,next[k],q[k]);';
 // For nonzero reset state, invert those FF outputs and their encoded next state.
 const resetAdapt=initialState?`wire [${n-1}:0] physical; wire [${n-1}:0] encoded=next^${n}'d${initialState}; assign q=physical^${n}'d${initialState};`:'';
 const inst=initialState?instance.replace(/q\[k\]/g,'physical[k]').replace(/next\[k\]/g,'encoded[k]'):instance;
 add(lab,q,title,page,`module circuit(input clk,rst${extraPorts},output [${n-1}:0] q${output?',output reg y':''});
reg [${n-1}:0] next; ${resetAdapt}
always @* begin next=q; ${output?'y=0;':''} ${nextLogic} ${output} end
genvar k; generate for(k=0;k<${n};k=k+1) begin:bits ${inst} end endgenerate
endmodule\n${helper}`,`reg clk=0,rst=0; wire [${n-1}:0] q; ${output?'wire y; reg expected_y;':''} reg [${n-1}:0] expected; ${decl}`,`circuit dut(clk,rst${conn},q${output?',y':''});`,
 `rst=1; #2; if(q!==${n}'d${initialState})$fatal(1,"Reset failed"); #5; rst=0; expected=${initialState};
 for(i=0;i<80;i=i+1) begin @(negedge clk); ${drive} ${reference} @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end`,
 `${notes} Explicit ${type.toUpperCase()} flip-flops; active-high asynchronous reset. Unused states recover to ${initialState}.`, 'always #5 clk=~clk;');
}
const state8=`case(q) 0:next=x?1:3; 1:next=x?0:2; 2:next=x?0:4; 3:next=x?1:3; 4:next=x?2:4; default:next=0; endcase`;
fsm(8,'Q1','Reduced state-table circuit using JK FFs','41–42',3,'jk',state8,`case(q) 2:y=~x; 3:y=1; 4:y=x; default:y=0; endcase`,',input x','reg x=0;',',x','x=((i*7+i/3)%11)>4;',`case(expected) 2:expected_y=~x; 3:expected_y=1; 4:expected_y=x; default:expected_y=0; endcase #1; if(y!==expected_y)$fatal(1,"Mealy output mismatch"); case(expected) 0:expected=x?1:3; 1:expected=x?0:2; 2:expected=x?0:4; 3:expected=x?1:3; 4:expected=x?2:4; default:expected=0; endcase`,'Equivalent groups: {a,c}=0, {b,e}=1, {d,h}=2, f=3, g=4. Output is Mealy (depends on current state and x).');
fsm(8,'Q2','State-diagram circuit using T FFs',42,2,'t',`case(q) 0:next=x?0:1; 1:next=x?2:3; 2:next=x?2:3; 3:next=x?3:0; endcase`,'',',input x','reg x=0;',',x','x=(i%7)>3;',`case(expected) 0:expected=x?0:1; 1:expected=x?2:3; 2:expected=x?2:3; 3:expected=x?3:0; endcase`,'Diagram transcribed: 00→01 on 0; 01→11 on 0 or 10 on 1; 10→11 on 0; 11→00 on 0; other 1 transitions hold.');
fsm(8,'A1','Enabled two-bit up/down JK circuit',42,2,'jk','if(en) next=x?q+2\'d1:q-2\'d1;','',',input en,x','reg en=0,x=0;',',en,x','en=(i%5)!=0; x=(i%12)<6;','if(en) expected=x?expected+2\'d1:expected-2\'d1;','E=0 holds. E=1: x=1 counts up, x=0 counts down.');
fsm(8,'A2','State-diagram circuit using D FFs',43,3,'d',`case(q) 1:next=x?1:4; 4:next=x?2:3; 3:next=x?1:2; 2:next=x?2:0; 0:next=x?3:4; default:next=1; endcase`,'',',input x','reg x=0;',',x','x=(i%9)>4;',`case(expected) 1:expected=x?1:4; 4:expected=x?2:3; 3:expected=x?1:2; 2:expected=x?2:0; 0:expected=x?3:4; default:expected=1; endcase`,'Diagram states 001,100,011,010,000. Initial state is chosen as 001.',1);

// LAB 9
fsm(9,'S1','3-bit synchronous T counter (as printed)',46,3,'t',`next[0]=~q[0]; next[1]=q[1]^~q[0]; next[2]=q[2]^(~q[0]&~q[1]);`,'','','','','','expected=expected-3\'d1;','The manual’s NAND connections implement a DOWN counter, not an up counter: 0,7,6,…,1. This preserves that printed behavior.');
add(9,'Q1','4-bit ring counter',48,`module circuit(input clk,rst,output reg [3:0] q); always @(posedge clk or posedge rst) if(rst)q<=4'b0001; else q<={q[2:0],q[3]}; endmodule`,'reg clk=0,rst=0; wire [3:0] q; reg [3:0] expected;','circuit dut(clk,rst,q);',`rst=1; #2; if(q!==1)$fatal; #5; rst=0; expected=1; for(i=0;i<20;i=i+1) begin @(negedge clk); expected={expected[2:0],expected[3]}; @(posedge clk); #1; if(q!==expected)$fatal; end`,'Reset seeds a single 1; 0001→0010→0100→1000.','always #5 clk=~clk;');
add(9,'Q2','6-bit Johnson counter',48,`module circuit(input clk,rst,output reg [5:0] q); always @(posedge clk or posedge rst) if(rst)q<=0; else q<={q[4:0],~q[5]}; endmodule`,'reg clk=0,rst=0; wire [5:0] q; reg [5:0] expected;','circuit dut(clk,rst,q);',`rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0; for(i=0;i<36;i=i+1) begin @(negedge clk); expected={expected[4:0],~expected[5]}; @(posedge clk); #1; if(q!==expected)$fatal; end`,'12-state cycle, starting at 000000.','always #5 clk=~clk;');
add(9,'Q3','4-bit ripple up counter, positive-edge T FFs',48,`module circuit(input clk,rst,output [3:0] q); tff first(clk,rst,1'b1,q[0]); genvar k; generate for(k=1;k<4;k=k+1) begin:b tff ff(~q[k-1],rst,1'b1,q[k]); end endgenerate endmodule\n${tff}`,'reg clk=0,rst=0; wire [3:0] q; reg [3:0] expected;','circuit dut(clk,rst,q);',`rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0; for(i=0;i<40;i=i+1) begin @(negedge clk); expected=expected+1; @(posedge clk); #1; if(q!==expected)$fatal; end`,'Each next positive-edge FF is clocked by the complement of the previous Q. Sample after ripple settles; no physical propagation delays are modeled.','always #5 clk=~clk;');
fsm(9,'A1','4-bit synchronous up/down JK counter',48,4,'jk',"next=w?q+4'd1:q-4'd1;",'',',input w','reg w=0;',',w','w=(i%40)<20;',"expected=w?expected+4'd1:expected-4'd1;",'W=1 counts up, W=0 counts down.');
add(9,'A2','High output every fifth clock',48,`module circuit(input clk,rst,output reg [2:0] count,output reg pulse); always @(posedge clk or posedge rst) if(rst)begin count<=0; pulse<=0; end else if(count==4)begin count<=0; pulse<=1; end else begin count<=count+1'b1; pulse<=0; end endmodule`,'reg clk=0,rst=0; wire [2:0] count; wire pulse;','circuit dut(clk,rst,count,pulse);',`rst=1; #2; #5; rst=0; for(i=1;i<=20;i=i+1) begin @(negedge clk); @(posedge clk); #1; if(pulse!==(i%5==0)||count!==(i%5))$fatal; end`,'Pulse stays high for one clock period after clocks 5,10,15,…','always #5 clk=~clk;');
add(9,'A3','Two-digit BCD counter',48,`module circuit(input clk,rst,output [3:0] tens,ones); wire rollover=ones==9; mod10 low(clk,rst,1'b1,ones); mod10 high(clk,rst,rollover,tens); endmodule
module mod10(input clk,rst,en,output reg [3:0] q); always @(posedge clk or posedge rst) if(rst)q<=0; else if(en)q<=q==9?0:q+1'b1; endmodule`,'reg clk=0,rst=0; wire [3:0] tens,ones; integer expected;','circuit dut(clk,rst,tens,ones);',`rst=1; #0.5; rst=0; expected=0; for(i=0;i<120;i=i+1)begin @(posedge clk); expected=(expected+1)%100; #0.1; if(tens*10+ones!=expected)$fatal; end`,'Two synchronous modulo-10 stages: 00 through 99, then 00.','always #1 clk=~clk;');

// LAB 10 — excitation method: T=Q XOR Qnext; J=S=~Q & Qnext; K=R=Q & ~Qnext.
for(const [q,title,type,seq,page] of [
 ['S1','Sequence 0,1,2,4,5,6','jk',[0,1,2,4,5,6],51],
 ['Q1','Modulo-7 sequence with JK FFs','jk',[0,1,2,3,4,5,6],52],
 ['Q2','Sequence 1,2,3,0,7,6,5 with SR FFs','sr',[1,2,3,0,7,6,5],52],
 ['Q3','Sequence 0,1,3,7,6,4 with T FFs','t',[0,1,3,7,6,4],52],
 ['A1','12-state non-binary T counter','t',[0,1,2,5,4,6,8,9,12,11,13,15],52]]){
 const n=Math.max(...seq)>7?4:3;
 const logic='case(q) '+seq.map((v,i)=>`${v}:next=${seq[(i+1)%seq.length]};`).join(' ')+` default:next=${seq[0]}; endcase`;
 const ref=seq.map((v,i)=>`seq_values[${i}]=${v};`).join(' ')+` expected=seq_values[(i+1)%${seq.length}];`;
 fsm(10,q,title,page,n,type,logic,'','',`reg [${n-1}:0] seq_values [0:${seq.length-1}];`,'','',ref,`Cycle: ${seq.join(' → ')} → ${seq[0]}. Excitations are derived from next-state equations, never S=R=1.`,seq[0]);
}
fsm(10,'A2','Controlled non-binary up/down T counter',52,3,'t',`case(q) 0:next=w?6:2; 2:next=w?0:3; 3:next=w?2:4; 4:next=w?3:6; 6:next=w?4:0; default:next=0; endcase`,'',',input w','reg w=0;',',w','w=i>=40;',`case(expected) 0:expected=w?6:2; 2:expected=w?0:3; 3:expected=w?2:4; 4:expected=w?3:6; 6:expected=w?4:0; default:expected=0; endcase`,'w=0: 0→2→3→4→6→0; w=1 reverses the same cycle.');

export function labCollectionText() {
 return '# DSD lab-sheet program collection\n\nSource: 03-DSD Lab Manual -2024.pdf (2024–2025). Covers all ten practical labs, main exercises, additional exercises, and solved code examples. Lab 11 in the contents is References, not a programming lab.\n\nThese are original, corrected reference solutions, not a verbatim transcription or an official answer key. Use them to learn and follow your course’s independent-work rules. Save each design and its testbench separately; do not concatenate all testbenches into one simulation. Unknown SR states and don’t-care rows are explained per entry. Testbenches use $fatal on mismatches.\n\n'+labPrograms.map(p=>`## ${p.name}\n\n${p.explanation}\n\n### design.v\n\n\x60\x60\x60verilog\n${p.design}\x60\x60\x60\n\n### testbench.v\n\n\x60\x60\x60verilog\n${p.testbench}\x60\x60\x60\n`).join('\n');
}
