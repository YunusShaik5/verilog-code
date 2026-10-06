# DSD lab-sheet program collection

Source: 03-DSD Lab Manual -2024.pdf (2024–2025). Covers all ten practical labs, main exercises, additional exercises, and solved code examples. Lab 11 in the contents is References, not a programming lab.

These are original, corrected reference solutions, not a verbatim transcription or an official answer key. Use them to learn and follow your course’s independent-work rules. Save each design and its testbench separately; do not concatenate all testbenches into one simulation. Unknown SR states and don’t-care rows are explained per entry. Testbenches use $fatal on mismatches.

## Lab 1 · S1 — Continuous-assignment sample

Exhaustive eight-vector test. Reference solution; manual printed page iii.

### design.v

```verilog
// Lab 1, S1: Continuous-assignment sample
// Exhaustive eight-vector test.
module lab1_s1_circuit (input a,b,c,output f);
assign f=(a&b)|(~b&c);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c; wire f;
  integer i;
  lab1_s1_circuit dut (a,b,c,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {a,b,c}=i; #2;
      if (f !== ((a&b)|(~b&c))) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-s1");
    $finish;
  end
endmodule
```

## Lab 1 · S2 — Structural gate sample

Exhaustive eight-vector test. Reference solution; manual printed page 8.

### design.v

```verilog
// Lab 1, S2: Structural gate sample
// Exhaustive eight-vector test.
module lab1_s2_circuit (input a,b,c,output f);
wire g,h,k; and(g,a,b); not(k,b); and(h,k,c); or(f,g,h);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c; wire f;
  integer i;
  lab1_s2_circuit dut (a,b,c,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {a,b,c}=i; #2;
      if (f !== ((a&b)|(~b&c))) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-s2");
    $finish;
  end
endmodule
```

## Lab 1 · S3 — Behavioral expression as printed

The expression on page 11 omits the NOT on b; it differs from the earlier structural sample. Reference solution; manual printed page 11.

### design.v

```verilog
// Lab 1, S3: Behavioral expression as printed
// The expression on page 11 omits the NOT on b; it differs from the earlier structural sample.
module lab1_s3_circuit (input a,b,c,output f);
assign f=(a&b)|(b&c);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c; wire f;
  integer i;
  lab1_s3_circuit dut (a,b,c,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {a,b,c}=i; #2;
      if (f !== ((a&b)|(b&c))) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-s3");
    $finish;
  end
endmodule
```

## Lab 1 · S4 — Solved K-map with don’t-cares

Minimum two-level SOP: (b & ~c) | (c & ~d). Don’t-care input rows are not asserted by the testbench. Reference solution; manual printed page 12.

### design.v

```verilog
// Lab 1, S4: Solved K-map with don’t-cares
// Minimum two-level SOP: (b & ~c) | (c & ~d). Don’t-care input rows are not asserted by the testbench.
module lab1_s4_circuit (input a,b,c,d,output f);
wire nc; not(nc,c);
wire nd; not(nd,d);
wire t0,t1;
and(t0,b,nc);
and(t1,c,nd);
or(f,t0,t1);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire f; localparam [15:0] EXPECT=16'h474, CARE=~16'hf000;
  integer i;
  lab1_s4_circuit dut (a,b,c,d,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (CARE[i] && f !== EXPECT[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-s4");
    $finish;
  end
endmodule
```

## Lab 1 · Q1a — SOP K-map

Minimum two-level SOP: (~a & ~b) | (~b & ~c) | (~c & ~d). Don’t-care input rows are not asserted by the testbench. Reference solution; manual printed page 13.

### design.v

```verilog
// Lab 1, Q1a: SOP K-map
// Minimum two-level SOP: (~a & ~b) | (~b & ~c) | (~c & ~d). Don’t-care input rows are not asserted by the testbench.
module lab1_q1a_circuit (input a,b,c,d,output f);
wire na; not(na,a);
wire nb; not(nb,b);
wire nc; not(nc,c);
wire nd; not(nd,d);
wire t0,t1,t2;
and(t0,na,nb);
and(t1,nb,nc);
and(t2,nc,nd);
or(f,t0,t1,t2);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire f; localparam [15:0] EXPECT=16'h131f, CARE=~16'h0;
  integer i;
  lab1_q1a_circuit dut (a,b,c,d,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (CARE[i] && f !== EXPECT[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-q1a");
    $finish;
  end
endmodule
```

## Lab 1 · Q1b — SOP K-map with don’t-cares

Minimum two-level SOP: (~a & ~d) | (~a & b & c) | (c & ~d) | (b & ~d). Don’t-care input rows are not asserted by the testbench. Reference solution; manual printed page 13.

### design.v

```verilog
// Lab 1, Q1b: SOP K-map with don’t-cares
// Minimum two-level SOP: (~a & ~d) | (~a & b & c) | (c & ~d) | (b & ~d). Don’t-care input rows are not asserted by the testbench.
module lab1_q1b_circuit (input a,b,c,d,output f);
wire na; not(na,a);
wire nd; not(nd,d);
wire t0,t1,t2,t3;
and(t0,na,nd);
and(t1,na,b,c);
and(t2,c,nd);
and(t3,b,nd);
or(f,t0,t1,t2,t3);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire f; localparam [15:0] EXPECT=16'h54d1, CARE=~16'h2004;
  integer i;
  lab1_q1b_circuit dut (a,b,c,d,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (CARE[i] && f !== EXPECT[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-q1b");
    $finish;
  end
endmodule
```

## Lab 1 · Q2a — POS K-map

Minimum two-level POS: (b | c) & (c | d) & (~a | ~b | ~c | ~d). Don’t-care input rows are not asserted by the testbench. Reference solution; manual printed page 13.

### design.v

```verilog
// Lab 1, Q2a: POS K-map
// Minimum two-level POS: (b | c) & (c | d) & (~a | ~b | ~c | ~d). Don’t-care input rows are not asserted by the testbench.
module lab1_q2a_circuit (input a,b,c,d,output f);
wire na; not(na,a);
wire nb; not(nb,b);
wire nc; not(nc,c);
wire nd; not(nd,d);
wire t0,t1,t2;
or(t0,b,c);
or(t1,c,d);
or(t2,na,nb,nc,nd);
and(f,t0,t1,t2);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire f; localparam [15:0] EXPECT=16'h6cec, CARE=~16'h0;
  integer i;
  lab1_q2a_circuit dut (a,b,c,d,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (CARE[i] && f !== EXPECT[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-q2a");
    $finish;
  end
endmodule
```

## Lab 1 · Q2b — POS K-map with don’t-cares

Minimum two-level POS: (a | ~b | c | ~d) & (~c | d) & (~a | d). Don’t-care input rows are not asserted by the testbench. Reference solution; manual printed page 13.

### design.v

```verilog
// Lab 1, Q2b: POS K-map with don’t-cares
// Minimum two-level POS: (a | ~b | c | ~d) & (~c | d) & (~a | d). Don’t-care input rows are not asserted by the testbench.
module lab1_q2b_circuit (input a,b,c,d,output f);
wire nb; not(nb,b);
wire nd; not(nd,d);
wire nc; not(nc,c);
wire na; not(na,a);
wire t0,t1,t2;
or(t0,a,nb,c,nd);
or(t1,nc,d);
or(t2,na,d);
and(f,t0,t1,t2);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire f; localparam [15:0] EXPECT=16'ha89b, CARE=~16'h5200;
  integer i;
  lab1_q2b_circuit dut (a,b,c,d,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (CARE[i] && f !== EXPECT[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-q2b");
    $finish;
  end
endmodule
```

## Lab 1 · A1 — Compare two Boolean functions

Not equivalent: a=b=c=0 gives f1=1 and f2=0. Reference solution; manual printed page 13.

### design.v

```verilog
// Lab 1, A1: Compare two Boolean functions
// Not equivalent: a=b=c=0 gives f1=1 and f2=0.
module lab1_a1_circuit (input a,b,c,output f1,f2,equal);
assign f1=(a&~c)|(b&c)|(~b&~c);
assign f2=(a|~b|c)&(a|b|~c)&(~a|b|~c); assign equal=(f1==f2);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c; wire f1,f2,equal;
  integer i;
  lab1_a1_circuit dut (a,b,c,f1,f2,equal);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {a,b,c}=i; #2;
      if (f1 !== ((a&~c)|(b&c)|(~b&~c)) || f2 !== ((a|~b|c)&(a|b|~c)&(~a|b|~c))) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab1-a1");
    $finish;
  end
endmodule
```

## Lab 1 · A2 — At least three of four inputs

 Reference solution; manual printed page 13.

### design.v

```verilog
// Lab 1, A2: At least three of four inputs
// 
module lab1_a2_circuit (input [3:0] x,output f);
assign f=(x[3]&x[2]&x[1])|(x[3]&x[2]&x[0])|(x[3]&x[1]&x[0])|(x[2]&x[1]&x[0]);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] x; wire f; integer total;
  integer i;
  lab1_a2_circuit dut (x,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<16;i=i+1) begin x=i; #2; total=(i>>3)+((i>>2)&1)+((i>>1)&1)+(i&1); if (f !== (total>=3)) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab1-a2");
    $finish;
  end
endmodule
```

## Lab 2 · S1 — Factored XOR-controlled function

g=a XOR b; f=g·c + g′·d. Reference solution; manual printed page 15.

### design.v

```verilog
// Lab 2, S1: Factored XOR-controlled function
// g=a XOR b; f=g·c + g′·d.
module lab2_s1_circuit (input a,b,c,d,output f);
wire g; assign g=a^b; assign f=(g&c)|(~g&d);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire f;
  integer i;
  lab2_s1_circuit dut (a,b,c,d,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (f !== ((a^b)?c:d)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab2-s1");
    $finish;
  end
endmodule
```

## Lab 2 · Q1 — Functional decomposition

For minterms 0,4,8,13,14,15: let g=ab and h=c+d, then f=g XNOR h. Reference solution; manual printed page 15.

### design.v

```verilog
// Lab 2, Q1: Functional decomposition
// For minterms 0,4,8,13,14,15: let g=ab and h=c+d, then f=g XNOR h.
module lab2_q1_circuit (input a,b,c,d,output f);
wire g,h; assign g=a&b; assign h=c|d;
assign f=(~g&~h)|(g&h);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire f; localparam [15:0] EXPECT=16'he111;
  integer i;
  lab2_q1_circuit dut (a,b,c,d,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (f !== EXPECT[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab2-q1");
    $finish;
  end
endmodule
```

## Lab 2 · Q2 — Behavioral full adder

 Reference solution; manual printed page 15.

### design.v

```verilog
// Lab 2, Q2: Behavioral full adder
// 
module lab2_q2_circuit (input a,b,cin,output reg sum,cout);
always @* {cout,sum}={1'b0,a}+{1'b0,b}+cin;
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,cin; wire sum,cout; integer expected;
  integer i;
  lab2_q2_circuit dut (a,b,cin,sum,cout);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<8;i=i+1) begin {a,b,cin}=i; #2; expected=(i>>2)+((i>>1)&1)+(i&1); if ({cout,sum} !== expected[1:0]) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab2-q2");
    $finish;
  end
endmodule
```

## Lab 2 · Q3 — 4-bit adder/subtractor

sub=0 adds, sub=1 computes A + ~B + 1. For subtraction, cout=1 means no borrow. Reference solution; manual printed page 15.

### design.v

```verilog
// Lab 2, Q3: 4-bit adder/subtractor
// sub=0 adds, sub=1 computes A + ~B + 1. For subtraction, cout=1 means no borrow.
module lab2_q3_circuit (input [3:0] a,b,input sub,output reg [3:0] result,output reg cout);
always @* {cout,result}={1'b0,a}+{1'b0,(b^{4{sub}})}+sub;
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] a,b; reg sub; wire [3:0] result; wire cout; reg [4:0] expected;
  integer i;
  lab2_q3_circuit dut (a,b,sub,result,cout);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<512;i=i+1) begin {sub,a,b}=i; expected={1'b0,a}+{1'b0,(b^{4{sub}})}+sub; #1; if ({cout,result} !== expected) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab2-q3");
    $finish;
  end
endmodule
```

## Lab 2 · Q4 — 3×3 multiplier from gates and adders

Partial products are AND gates; two ripple-adder stages combine them. Reference solution; manual printed page 15.

### design.v

```verilog
// Lab 2, Q4: 3×3 multiplier from gates and adders
// Partial products are AND gates; two ripple-adder stages combine them.
module lab2_q4_circuit (input [2:0] a,b,output [5:0] p);
wire [5:0] r0,r1,r2,s; wire [6:0] c0,c1;
assign r0={3'b0,a&{3{b[0]}}}; assign r1={2'b0,a&{3{b[1]}},1'b0}; assign r2={1'b0,a&{3{b[2]}},2'b0};
assign c0[0]=0; assign c1[0]=0;
genvar k; generate for(k=0;k<6;k=k+1) begin: stages
lab2_q4_fa u0(r0[k],r1[k],c0[k],s[k],c0[k+1]); lab2_q4_fa u1(s[k],r2[k],c1[k],p[k],c1[k+1]); end endgenerate
endmodule
module lab2_q4_fa(input a,b,cin, output sum,cout);
  assign sum=a^b^cin; assign cout=(a&b)|(cin&(a^b));
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [2:0] a,b; wire [5:0] p; reg [5:0] expected;
  integer i;
  lab2_q4_circuit dut (a,b,p);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<64;i=i+1) begin {a,b}=i; expected=a*b; #2; if (p !== expected) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab2-q4");
    $finish;
  end
endmodule
```

## Lab 2 · A1 — Two-digit BCD adder

Only valid BCD digits are inputs. cout is the hundreds digit. Tests every 00–99 pair. Reference solution; manual printed page 16.

### design.v

```verilog
// Lab 2, A1: Two-digit BCD adder
// Only valid BCD digits are inputs. cout is the hundreds digit. Tests every 00–99 pair.
module lab2_a1_circuit (input [7:0] a,b,output [7:0] sum,output cout);
wire carry; lab2_a1_bcd_digit lo(a[3:0],b[3:0],1'b0,sum[3:0],carry); lab2_a1_bcd_digit hi(a[7:4],b[7:4],carry,sum[7:4],cout);
endmodule
module lab2_a1_bcd_digit(input [3:0] a,b,input cin,output [3:0] s,output cout); wire [4:0] raw,corrected; assign raw={1'b0,a}+{1'b0,b}+cin; assign cout=raw>9; assign corrected=raw+(cout?5'd6:5'd0); assign s=corrected[3:0]; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [7:0] a,b; wire [7:0] sum; wire cout; integer j,expected;
  integer i;
  lab2_a1_circuit dut (a,b,sum,cout);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<100;i=i+1) for(j=0;j<100;j=j+1) begin a=((i/10)<<4)|(i%10); b=((j/10)<<4)|(j%10); expected=i+j; #0.01; if (100*cout+10*sum[7:4]+sum[3:0] != expected) $fatal(1,"BCD addition failed"); end
    $display("PASS: lab2-a1");
    $finish;
  end
endmodule
```

## Lab 2 · A2 — Logic operations using full adders

cin=0 gives XOR and AND; cin=1 gives XNOR and OR. Two more full adders invert carry outputs. Reference solution; manual printed page 16.

### design.v

```verilog
// Lab 2, A2: Logic operations using full adders
// cin=0 gives XOR and AND; cin=1 gives XNOR and OR. Two more full adders invert carry outputs.
module lab2_a2_circuit (input a,b,output and_y,nand_y,nor_y,or_y,xor_y,xnor_y);
wire unused,unused2,unused3,unused4;
lab2_a2_fa u0(a,b,1'b0,xor_y,and_y); lab2_a2_fa u1(a,b,1'b1,xnor_y,or_y);
lab2_a2_fa u2(and_y,1'b0,1'b1,nand_y,unused); lab2_a2_fa u3(or_y,1'b0,1'b1,nor_y,unused2);
endmodule
module lab2_a2_fa(input a,b,cin, output sum,cout);
  assign sum=a^b^cin; assign cout=(a&b)|(cin&(a^b));
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b; wire and_y,nand_y,nor_y,or_y,xor_y,xnor_y;
  integer i;
  lab2_a2_circuit dut (a,b,and_y,nand_y,nor_y,or_y,xor_y,xnor_y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<4; i=i+1) begin
      {a,b}=i; #2;
      if ({and_y,nand_y,nor_y,or_y,xor_y,xnor_y} !== {(a&b),~(a&b),~(a|b),(a|b),(a^b),~(a^b)}) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab2-a2");
    $finish;
  end
endmodule
```

## Lab 3 · S1 — 2:1 mux using always and conditional

 Reference solution; manual printed page 20.

### design.v

```verilog
// Lab 3, S1: 2:1 mux using always and conditional
// 
module lab3_s1_circuit (input a,b,s,output reg y);
always @* y=s?b:a;
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,s; wire y;
  integer i;
  lab3_s1_circuit dut (a,b,s,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {a,b,s}=i; #2;
      if (y !== (s?b:a)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab3-s1");
    $finish;
  end
endmodule
```

## Lab 3 · Q1 — 4:1 mux with if–else

 Reference solution; manual printed page 22.

### design.v

```verilog
// Lab 3, Q1: 4:1 mux with if–else
// 
module lab3_q1_circuit (input [3:0] d,input [1:0] s,output reg y);
always @* if(s==0) y=d[0]; else if(s==1) y=d[1]; else if(s==2) y=d[2]; else y=d[3];
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] d; reg [1:0] s; wire y;
  integer i;
  lab3_q1_circuit dut (d,s,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<64; i=i+1) begin
      {d,s}=i; #2;
      if (y !== d[s]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab3-q1");
    $finish;
  end
endmodule
```

## Lab 3 · Q2a — 8:1 mux with case

The 8:1 building block used in Q2b. Reference solution; manual printed page 22.

### design.v

```verilog
// Lab 3, Q2a: 8:1 mux with case
// The 8:1 building block used in Q2b.
module lab3_q2a_circuit (input [7:0] d,input [2:0] s,output y);
lab3_q2a_mux8 m(d,s,y);
endmodule
module lab3_q2a_mux8(input [7:0] d,input [2:0] s,output reg y);
  always @* case(s)
    0:y=d[0]; 1:y=d[1]; 2:y=d[2]; 3:y=d[3];
    4:y=d[4]; 5:y=d[5]; 6:y=d[6]; 7:y=d[7];
    default:y=1'bx;
  endcase
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [7:0] d; reg [2:0] s; wire y;
  integer i;
  lab3_q2a_circuit dut (d,s,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<256;i=i+1) begin d=i; s=i%8; #2; if (y !== d[s]) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab3-q2a");
    $finish;
  end
endmodule
```

## Lab 3 · Q2b — Hierarchical 16:1 mux

Two 8:1 multiplexers feed one 2:1 multiplexer. Reference solution; manual printed page 22.

### design.v

```verilog
// Lab 3, Q2b: Hierarchical 16:1 mux
// Two 8:1 multiplexers feed one 2:1 multiplexer.
module lab3_q2b_circuit (input [15:0] d,input [3:0] s,output y);
wire lo,hi; lab3_q2b_mux8 m0(d[7:0],s[2:0],lo); lab3_q2b_mux8 m1(d[15:8],s[2:0],hi); lab3_q2b_mux2 m2(lo,hi,s[3],y);
endmodule
module lab3_q2b_mux8(input [7:0] d,input [2:0] s,output reg y);
  always @* case(s)
    0:y=d[0]; 1:y=d[1]; 2:y=d[2]; 3:y=d[3];
    4:y=d[4]; 5:y=d[5]; 6:y=d[6]; 7:y=d[7];
    default:y=1'bx;
  endcase
endmodule
module lab3_q2b_mux2(input a,b,s, output y); assign y=s?b:a; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [15:0] d; reg [3:0] s; wire y; integer j;
  integer i;
  lab3_q2b_circuit dut (d,s,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<16;i=i+1) for(j=0;j<16;j=j+1) begin d=16'b1<<i; s=j; #2; if (y !== d[s]) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab3-q2b");
    $finish;
  end
endmodule
```

## Lab 3 · Q3 — 3-bit comparator using logic equations

Behavioral description uses only bitwise gate equations, not comparison operators. Reference solution; manual printed page 22.

### design.v

```verilog
// Lab 3, Q3: 3-bit comparator using logic equations
// Behavioral description uses only bitwise gate equations, not comparison operators.
module lab3_q3_circuit (input [2:0] a,b,output reg gt,eq,lt);
reg [2:0] e; always @* begin e=~(a^b); eq=&e;
gt=(a[2]&~b[2])|(e[2]&a[1]&~b[1])|(e[2]&e[1]&a[0]&~b[0]);
lt=(~a[2]&b[2])|(e[2]&~a[1]&b[1])|(e[2]&e[1]&~a[0]&b[0]); end
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [2:0] a,b; wire gt,eq,lt;
  integer i;
  lab3_q3_circuit dut (a,b,gt,eq,lt);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<64; i=i+1) begin
      {a,b}=i; #2;
      if ({gt,eq,lt} !== {(a>b),(a==b),(a<b)}) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab3-q3");
    $finish;
  end
endmodule
```

## Lab 3 · Q4 — N-bit binary to Gray using for loop

N defaults to 4; top Gray bit equals top binary bit. Reference solution; manual printed page 22.

### design.v

```verilog
// Lab 3, Q4: N-bit binary to Gray using for loop
// N defaults to 4; top Gray bit equals top binary bit.
module lab3_q4_circuit #(parameter N=4)(input [N-1:0] binary,output reg [N-1:0] gray); integer k; always @* begin gray[N-1]=binary[N-1]; for(k=0;k<N-1;k=k+1) gray[k]=binary[k+1]^binary[k]; end endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] binary; wire [3:0] gray;
  integer i;
  lab3_q4_circuit dut(binary,gray);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      binary=i; #2;
      if (gray !== (binary^(binary>>1))) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab3-q4");
    $finish;
  end
endmodule
```

## Lab 3 · A1 — BCD to excess-3, K-map equations

Valid inputs 0–9; 10–15 are don’t-cares in minimization. Reference solution; manual printed page 22.

### design.v

```verilog
// Lab 3, A1: BCD to excess-3, K-map equations
// Valid inputs 0–9; 10–15 are don’t-cares in minimization.
module lab3_a1_circuit (input a,b,c,d,output [3:0] e);
assign e[3]=a|(b&c)|(b&d); assign e[2]=(~b&(c|d))|(b&~c&~d); assign e[1]=~(c^d); assign e[0]=~d;
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire [3:0] e;
  integer i;
  lab3_a1_circuit dut (a,b,c,d,e);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<10; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (e !== (i+3)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab3-a1");
    $finish;
  end
endmodule
```

## Lab 3 · A2 — 4-bit comparator from 2-bit comparators

 Reference solution; manual printed page 22.

### design.v

```verilog
// Lab 3, A2: 4-bit comparator from 2-bit comparators
// 
module lab3_a2_circuit (input [3:0] a,b,output gt,eq,lt);
wire gh,eh,lh,gl,el,ll; lab3_a2_cmp2 hi(a[3:2],b[3:2],gh,eh,lh); lab3_a2_cmp2 lo(a[1:0],b[1:0],gl,el,ll); assign gt=gh|(eh&gl); assign eq=eh&el; assign lt=lh|(eh&ll);
endmodule
module lab3_a2_cmp2(input [1:0] a,b,output gt,eq,lt); assign gt=a>b; assign eq=a==b; assign lt=a<b; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] a,b; wire gt,eq,lt;
  integer i;
  lab3_a2_circuit dut (a,b,gt,eq,lt);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<256; i=i+1) begin
      {a,b}=i; #2;
      if ({gt,eq,lt} !== {(a>b),(a==b),(a<b)}) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab3-a2");
    $finish;
  end
endmodule
```

## Lab 4 · S1 — 2:4 decoder using for loop

Output y[k] is high for address k. Reference solution; manual printed page 24.

### design.v

```verilog
// Lab 4, S1: 2:4 decoder using for loop
// Output y[k] is high for address k.
module lab4_s1_circuit (input [1:0] a,input en,output reg [3:0] y);
integer k; always @* for(k=0;k<4;k=k+1) y[k]=en&&(a==k);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [1:0] a; reg en; wire [3:0] y;
  integer i;
  lab4_s1_circuit dut (a,en,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {en,a}=i; #2;
      if (y !== (en?(4'b1<<a):4'b0)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab4-s1");
    $finish;
  end
endmodule
```

## Lab 4 · Q1 — 2:4 decoder, active-low enable

Active-high outputs; if–else building block. Reference solution; manual printed page 26.

### design.v

```verilog
// Lab 4, Q1: 2:4 decoder, active-low enable
// Active-high outputs; if–else building block.
module lab4_q1_circuit (input [1:0] a,input en_n,output [3:0] y);
lab4_q1_declow d(a,en_n,y);
endmodule
module lab4_q1_declow(input [1:0] a,input en_n,output reg [3:0] y); always @* begin y=0; if(!en_n) begin if(a==0)y=1; else if(a==1)y=2; else if(a==2)y=4; else y=8; end end endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [1:0] a; reg en_n; wire [3:0] y;
  integer i;
  lab4_q1_circuit dut (a,en_n,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {en_n,a}=i; #2;
      if (y !== (en_n?4'b0:(4'b1<<a))) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab4-q1");
    $finish;
  end
endmodule
```

## Lab 4 · Q2 — 4:16 decoder from Q1 blocks

Five active-low-enable 2:4 blocks make an active-high-enable decoder. Reference solution; manual printed page 26.

### design.v

```verilog
// Lab 4, Q2: 4:16 decoder from Q1 blocks
// Five active-low-enable 2:4 blocks make an active-high-enable decoder.
module lab4_q2_circuit (input [3:0] a,input en,output [15:0] y);
wire [3:0] bank; lab4_q2_declow top(a[3:2],~en,bank); genvar k; generate for(k=0;k<4;k=k+1) begin:b lab4_q2_declow leaf(a[1:0],~bank[k],y[4*k+:4]); end endgenerate
endmodule
module lab4_q2_declow(input [1:0] a,input en_n,output reg [3:0] y); always @* begin y=0; if(!en_n) begin if(a==0)y=1; else if(a==1)y=2; else if(a==2)y=4; else y=8; end end endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] a; reg en; wire [15:0] y;
  integer i;
  lab4_q2_circuit dut (a,en,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<32; i=i+1) begin
      {en,a}=i; #2;
      if (y !== (en?(16'b1<<a):16'b0)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab4-q2");
    $finish;
  end
endmodule
```

## Lab 4 · Q3 — 4:2 priority encoder with casex

Highest input bit has priority. casex is required by the sheet but can hide X/Z errors; only binary vectors are tested. Reference solution; manual printed page 26.

### design.v

```verilog
// Lab 4, Q3: 4:2 priority encoder with casex
// Highest input bit has priority. casex is required by the sheet but can hide X/Z errors; only binary vectors are tested.
module lab4_q3_circuit (input [3:0] d,output reg [1:0] code,output reg valid);
always @* begin valid=1; casex(d) 4'b1xxx:code=3; 4'b01xx:code=2; 4'b001x:code=1; 4'b0001:code=0; default:begin code=0; valid=0; end endcase end
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] d; wire [1:0] code; wire valid; reg [1:0] expected; integer k;
  integer i;
  lab4_q3_circuit dut (d,code,valid);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<16;i=i+1) begin d=i; expected=0; for(k=0;k<4;k=k+1) if(d[k])expected=k; #2; if (code !== expected || valid !== (d!=0)) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab4-q3");
    $finish;
  end
endmodule
```

## Lab 4 · Q4 — 16:4 priority encoder with for loop

Later loop iterations override earlier ones: bit 15 has highest priority. Reference solution; manual printed page 26.

### design.v

```verilog
// Lab 4, Q4: 16:4 priority encoder with for loop
// Later loop iterations override earlier ones: bit 15 has highest priority.
module lab4_q4_circuit (input [15:0] d,output reg [3:0] code,output reg valid);
integer k; always @* begin code=0; valid=0; for(k=0;k<16;k=k+1) if(d[k]) begin code=k; valid=1; end end
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [15:0] d; wire [3:0] code; wire valid;
  integer i;
  lab4_q4_circuit dut (d,code,valid);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
d=0; #2; if(valid!==0)$fatal; for(i=0;i<16;i=i+1) begin d=(32'b1<<(i+1))-1; #2; if (code !== i[3:0] || valid !== 1) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab4-q4");
    $finish;
  end
endmodule
```

## Lab 4 · A1a — Active-high 2:4 decoder with case

Building block for A1b. Reference solution; manual printed page 26.

### design.v

```verilog
// Lab 4, A1a: Active-high 2:4 decoder with case
// Building block for A1b.
module lab4_a1a_circuit (input [1:0] a,input en,output [3:0] y);
lab4_a1a_deccase d(a,en,y);
endmodule
module lab4_a1a_deccase(input [1:0] a,input en,output reg [3:0] y); always @* begin y=0; if(en) case(a) 0:y=1; 1:y=2; 2:y=4; 3:y=8; default:y=0; endcase end endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [1:0] a; reg en; wire [3:0] y;
  integer i;
  lab4_a1a_circuit dut (a,en,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {en,a}=i; #2;
      if (y !== (en?(4'b1<<a):4'b0)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab4-a1a");
    $finish;
  end
endmodule
```

## Lab 4 · A1b — 4:16 decoder, active-low enable

Active-high outputs. Reference solution; manual printed page 26.

### design.v

```verilog
// Lab 4, A1b: 4:16 decoder, active-low enable
// Active-high outputs.
module lab4_a1b_circuit (input [3:0] a,input en_n,output [15:0] y);
wire [3:0] bank; lab4_a1b_deccase top(a[3:2],~en_n,bank); genvar k; generate for(k=0;k<4;k=k+1) begin:b lab4_a1b_deccase leaf(a[1:0],bank[k],y[4*k+:4]); end endgenerate
endmodule
module lab4_a1b_deccase(input [1:0] a,input en,output reg [3:0] y); always @* begin y=0; if(en) case(a) 0:y=1; 1:y=2; 2:y=4; 3:y=8; default:y=0; endcase end endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] a; reg en_n; wire [15:0] y;
  integer i;
  lab4_a1b_circuit dut (a,en_n,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<32; i=i+1) begin
      {en_n,a}=i; #2;
      if (y !== (en_n?16'b0:(16'b1<<a))) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab4-a1b");
    $finish;
  end
endmodule
```

## Lab 4 · A2a — 3:8 decoder, active-low outputs

Active-high enable, if–else implementation. Reference solution; manual printed page 26.

### design.v

```verilog
// Lab 4, A2a: 3:8 decoder, active-low outputs
// Active-high enable, if–else implementation.
module lab4_a2a_circuit (input [2:0] a,input en,output [7:0] y);
lab4_a2a_dec3low d(a,en,y);
endmodule
module lab4_a2a_dec3low(input [2:0] a,input en,output reg [7:0] y); always @* begin y=8'hff; if(en) begin if(a==0)y=8'hfe; else if(a==1)y=8'hfd; else if(a==2)y=8'hfb; else if(a==3)y=8'hf7; else if(a==4)y=8'hef; else if(a==5)y=8'hdf; else if(a==6)y=8'hbf; else y=8'h7f; end end endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [2:0] a; reg en; wire [7:0] y;
  integer i;
  lab4_a2a_circuit dut (a,en,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {en,a}=i; #2;
      if (y !== (en?~(8'b1<<a):8'hff)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab4-a2a");
    $finish;
  end
endmodule
```

## Lab 4 · A2b — 5:32 decoder tree, active-low outputs

One 2:4 and four 3:8 decoders. Reference solution; manual printed page 26.

### design.v

```verilog
// Lab 4, A2b: 5:32 decoder tree, active-low outputs
// One 2:4 and four 3:8 decoders.
module lab4_a2b_circuit (input [4:0] a,input en,output [31:0] y);
wire [3:0] bank; lab4_a2b_dec2 top(a[4:3],en,bank); genvar k; generate for(k=0;k<4;k=k+1) begin:b lab4_a2b_dec3low leaf(a[2:0],bank[k],y[8*k+:8]); end endgenerate
endmodule
module lab4_a2b_dec2(input [1:0] a,input en,output [3:0] y); assign y=en?(4'b1<<a):4'b0; endmodule
module lab4_a2b_dec3low(input [2:0] a,input en,output reg [7:0] y); always @* begin y=8'hff; if(en) begin if(a==0)y=8'hfe; else if(a==1)y=8'hfd; else if(a==2)y=8'hfb; else if(a==3)y=8'hf7; else if(a==4)y=8'hef; else if(a==5)y=8'hdf; else if(a==6)y=8'hbf; else y=8'h7f; end end endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [4:0] a; reg en; wire [31:0] y;
  integer i;
  lab4_a2b_circuit dut (a,en,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<64; i=i+1) begin
      {en,a}=i; #2;
      if (y !== (en?~(32'b1<<a):32'hffffffff)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab4-a2b");
    $finish;
  end
endmodule
```

## Lab 5 · S1 — XOR using a 2:1 mux

Corrected the solved example’s inconsistent module name. Reference solution; manual printed page 28.

### design.v

```verilog
// Lab 5, S1: XOR using a 2:1 mux
// Corrected the solved example’s inconsistent module name.
module lab5_s1_circuit (input a,b,output y);
lab5_s1_mux2 m(b,~b,a,y);
endmodule
module lab5_s1_mux2(input a,b,s, output y); assign y=s?b:a; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b; wire y;
  integer i;
  lab5_s1_circuit dut (a,b,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<4; i=i+1) begin
      {a,b}=i; #2;
      if (y !== (a^b)) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab5-s1");
    $finish;
  end
endmodule
```

## Lab 5 · Q1 — Minterm function using 4:1 mux

Select AB; I0=C′+D′, I1=D′, I2=C′D, I3=D′. Minterms 0,1,2,4,6,9,12,14. Reference solution; manual printed page 29.

### design.v

```verilog
// Lab 5, Q1: Minterm function using 4:1 mux
// Select AB; I0=C′+D′, I1=D′, I2=C′D, I3=D′. Minterms 0,1,2,4,6,9,12,14.
module lab5_q1_circuit (input a,b,c,d,output f);
wire [3:0] data; assign data={~d,(~c&d),~d,(~c|~d)}; lab5_q1_mux4 m(data,{a,b},f);
endmodule
module lab5_q1_mux4(input [3:0] d,input [1:0] s,output y); assign y=d[s]; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire f; localparam [15:0] EXPECT=16'h5257;
  integer i;
  lab5_q1_circuit dut (a,b,c,d,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (f !== EXPECT[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab5-q1");
    $finish;
  end
endmodule
```

## Lab 5 · Q2 — 4-bit Gray to binary using 8:1 muxes

Each binary bit is the XOR of Gray bits from the MSB down to that bit. Reference solution; manual printed page 29.

### design.v

```verilog
// Lab 5, Q2: 4-bit Gray to binary using 8:1 muxes
// Each binary bit is the XOR of Gray bits from the MSB down to that bit.
module lab5_q2_circuit (input [3:0] g,output [3:0] b);
assign b[3]=g[3];
lab5_q2_mux8 u2({4{~g[2],g[2]}},{2'b0,g[3]},b[2]);
lab5_q2_mux8 u1(8'b10010110,g[3:1],b[1]);
lab5_q2_mux8 u0({~g[0],g[0],g[0],~g[0],g[0],~g[0],~g[0],g[0]},g[3:1],b[0]);
endmodule
module lab5_q2_mux8(input [7:0] d,input [2:0] s,output reg y);
  always @* case(s)
    0:y=d[0]; 1:y=d[1]; 2:y=d[2]; 3:y=d[3];
    4:y=d[4]; 5:y=d[5]; 6:y=d[6]; 7:y=d[7];
    default:y=1'bx;
  endcase
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] g; wire [3:0] b;
  integer i;
  lab5_q2_circuit dut (g,b);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      g=i; #2;
      if (b !== {g[3],(g[3]^g[2]),(g[3]^g[2]^g[1]),(^g)}) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab5-q2");
    $finish;
  end
endmodule
```

## Lab 5 · Q3 — Minterm function using 4:16 decoder

One-hot decoder outputs for minterms 2,3,4,5,6,7,10,11,12,15 feed the OR gate. Reference solution; manual printed page 29.

### design.v

```verilog
// Lab 5, Q3: Minterm function using 4:16 decoder
// One-hot decoder outputs for minterms 2,3,4,5,6,7,10,11,12,15 feed the OR gate.
module lab5_q3_circuit (input [3:0] a,output f);
wire [15:0] y; assign y=16'b1<<a; or(f,y[2],y[3],y[4],y[5],y[6],y[7],y[10],y[11],y[12],y[15]);
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg [3:0] a; wire f; localparam [15:0] EXPECT=16'h9cfc;
  integer i;
  lab5_q3_circuit dut (a,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<16; i=i+1) begin
      a=i; #2;
      if (f !== EXPECT[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab5-q3");
    $finish;
  end
endmodule
```

## Lab 5 · Q4 — Three-input majority using decoder

 Reference solution; manual printed page 29.

### design.v

```verilog
// Lab 5, Q4: Three-input majority using decoder
// 
module lab5_q4_circuit (input a,b,c,output f);
wire [3:0] y; lab5_q4_dec2 d({a,b},1'b1,y); assign f=y[3]|(c&(y[1]|y[2]));
endmodule
module lab5_q4_dec2(input [1:0] a,input en,output [3:0] y); assign y=en?(4'b1<<a):4'b0; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c; wire f;
  integer i;
  lab5_q4_circuit dut (a,b,c,f);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
    for (i=0; i<8; i=i+1) begin
      {a,b,c}=i; #2;
      if (f !== ((a&b)|(a&c)|(b&c))) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab5-q4");
    $finish;
  end
endmodule
```

## Lab 5 · A1 — BCD to Aiken 2421 using 4:1 muxes

Aiken mapping 0,1,2,3,4,B,C,D,E,F. Invalid BCD inputs produce 0000. Reference solution; manual printed page 29.

### design.v

```verilog
// Lab 5, A1: BCD to Aiken 2421 using 4:1 muxes
// Aiken mapping 0,1,2,3,4,B,C,D,E,F. Invalid BCD inputs produce 0000.
module lab5_a1_circuit (input a,b,c,d,output [3:0] y);
wire [3:0] data0,data1,data2,data3;
assign data0[0]=(~c & d) | (c & d);
assign data0[1]=(~c & d) | (c & d);
assign data0[2]=(~c & d);
assign data0[3]=1'b0;
lab5_a1_mux4 m0(data0,{a,b},y[0]);
assign data1[0]=(c & ~d) | (c & d);
assign data1[1]=(~c & d);
assign data1[2]=(~c & ~d) | (~c & d);
assign data1[3]=1'b0;
lab5_a1_mux4 m1(data1,{a,b},y[1]);
assign data2[0]=1'b0;
assign data2[1]=(~c & ~d) | (c & ~d) | (c & d);
assign data2[2]=(~c & ~d) | (~c & d);
assign data2[3]=1'b0;
lab5_a1_mux4 m2(data2,{a,b},y[2]);
assign data3[0]=1'b0;
assign data3[1]=(~c & d) | (c & ~d) | (c & d);
assign data3[2]=(~c & ~d) | (~c & d);
assign data3[3]=1'b0;
lab5_a1_mux4 m3(data3,{a,b},y[3]);

endmodule
module lab5_a1_mux4(input [3:0] d,input [1:0] s,output y); assign y=d[s]; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,c,d; wire [3:0] y; reg [3:0] expected [0:9];
  integer i;
  lab5_a1_circuit dut (a,b,c,d,y);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
expected[0]=4'd0;
expected[1]=4'd1;
expected[2]=4'd2;
expected[3]=4'd3;
expected[4]=4'd4;
expected[5]=4'd11;
expected[6]=4'd12;
expected[7]=4'd13;
expected[8]=4'd14;
expected[9]=4'd15;
    for (i=0; i<10; i=i+1) begin
      {a,b,c,d}=i; #2;
      if (y !== expected[i]) $fatal(1, "Output mismatch at vector %0d", i);
    end
    $display("PASS: lab5-a1");
    $finish;
  end
endmodule
```

## Lab 5 · A2 — Full adder using decoders

A 2:4 decoder expands AB; gates incorporate carry-in. Reference solution; manual printed page 29.

### design.v

```verilog
// Lab 5, A2: Full adder using decoders
// A 2:4 decoder expands AB; gates incorporate carry-in.
module lab5_a2_circuit (input a,b,cin,output sum,cout);
wire [3:0] y; lab5_a2_dec2 d({a,b},1'b1,y); assign sum=(~cin&(y[1]|y[2]))|(cin&(y[0]|y[3])); assign cout=y[3]|(cin&(y[1]|y[2]));
endmodule
module lab5_a2_dec2(input [1:0] a,input en,output [3:0] y); assign y=en?(4'b1<<a):4'b0; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg a,b,cin; wire sum,cout; reg [1:0] expected;
  integer i;
  lab5_a2_circuit dut (a,b,cin,sum,cout);

  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
for(i=0;i<8;i=i+1) begin {a,b,cin}=i; expected={1'b0,a}+{1'b0,b}+cin; #2; if ({cout,sum} !== expected) $fatal(1, "Output mismatch at vector %0d", i); end
    $display("PASS: lab5-a2");
    $finish;
  end
endmodule
```

## Lab 6 · S1 — D flip-flop, synchronous active-low reset

Synchronous active-low reset; rising clock edge. Reference solution; manual printed page 31.

### design.v

```verilog
// Lab 6, S1: D flip-flop, synchronous active-low reset
// Synchronous active-low reset; rising clock edge.
module lab6_s1_circuit(input clk,rst,d,output reg q); always @(posedge clk) if(!rst) q<=0; else q<=d; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=1,d=0; wire q; reg expected;
  integer i;
  lab6_s1_circuit dut(clk,rst,d,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=0; #2;  @(posedge clk); #1; if(q!==0)$fatal(1,"Reset failed"); expected=0;
    @(negedge clk); rst=1;
    for(i=0;i<12;i=i+1) begin {d}=i; expected=d; @(posedge clk); #1; if(q!==expected)$fatal(1,"Flip-flop mismatch"); @(negedge clk); end
    $display("PASS: lab6-s1");
    $finish;
  end
endmodule
```

## Lab 6 · Q1 — D flip-flop, synchronous active-high reset

Synchronous active-high reset; rising clock edge. Reference solution; manual printed page 33.

### design.v

```verilog
// Lab 6, Q1: D flip-flop, synchronous active-high reset
// Synchronous active-high reset; rising clock edge.
module lab6_q1_circuit(input clk,rst,d,output reg q); always @(posedge clk) if(rst) q<=0; else q<=d; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0,d=0; wire q; reg expected;
  integer i;
  lab6_q1_circuit dut(clk,rst,d,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2;  @(posedge clk); #1; if(q!==0)$fatal(1,"Reset failed"); expected=0;
    @(negedge clk); rst=0;
    for(i=0;i<12;i=i+1) begin {d}=i; expected=d; @(posedge clk); #1; if(q!==expected)$fatal(1,"Flip-flop mismatch"); @(negedge clk); end
    $display("PASS: lab6-q1");
    $finish;
  end
endmodule
```

## Lab 6 · Q2 — T flip-flop, synchronous active-low reset

Synchronous active-low reset; falling clock edge. Reference solution; manual printed page 33.

### design.v

```verilog
// Lab 6, Q2: T flip-flop, synchronous active-low reset
// Synchronous active-low reset; falling clock edge.
module lab6_q2_circuit(input clk,rst,t,output reg q); always @(negedge clk) if(!rst) q<=0; else q<=q^t; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=1,rst=1,t=0; wire q; reg expected;
  integer i;
  lab6_q2_circuit dut(clk,rst,t,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=0; #2;  @(negedge clk); #1; if(q!==0)$fatal(1,"Reset failed"); expected=0;
    @(posedge clk); rst=1;
    for(i=0;i<12;i=i+1) begin {t}=i; expected=expected^t; @(negedge clk); #1; if(q!==expected)$fatal(1,"Flip-flop mismatch"); @(posedge clk); end
    $display("PASS: lab6-q2");
    $finish;
  end
endmodule
```

## Lab 6 · Q3 — JK flip-flop, asynchronous active-high reset

Asynchronous active-high reset; rising clock edge. Reference solution; manual printed page 33.

### design.v

```verilog
// Lab 6, Q3: JK flip-flop, asynchronous active-high reset
// Asynchronous active-high reset; rising clock edge.
module lab6_q3_circuit(input clk,rst,j,k,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(j&~q)|(~k&q); endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0,j=0,k=0; wire q; reg expected;
  integer i;
  lab6_q3_circuit dut(clk,rst,j,k,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==0)$fatal(1,"Async reset failed"); @(posedge clk); #1; if(q!==0)$fatal(1,"Reset failed"); expected=0;
    @(negedge clk); rst=0;
    for(i=0;i<12;i=i+1) begin {j,k}=i; expected=(j&~expected)|(~k&expected); @(posedge clk); #1; if(q!==expected)$fatal(1,"Flip-flop mismatch"); @(negedge clk); end
    $display("PASS: lab6-q3");
    $finish;
  end
endmodule
```

## Lab 6 · Q4 — SR flip-flop, asynchronous active-low reset

Asynchronous active-low reset; falling clock edge. S=R=1 is forbidden and modeled as X, not a usable hardware state. Reference solution; manual printed page 33.

### design.v

```verilog
// Lab 6, Q4: SR flip-flop, asynchronous active-low reset
// Asynchronous active-low reset; falling clock edge. S=R=1 is forbidden and modeled as X, not a usable hardware state.
module lab6_q4_circuit(input clk,rst,s,r,output reg q); always @(negedge clk or negedge rst) if(!rst) q<=0; else case({s,r}) 0:q<=q; 1:q<=0; 2:q<=1; 3:q<=1'bx; endcase endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=1,rst=1,s=0,r=0; wire q; reg expected;
  integer i;
  lab6_q4_circuit dut(clk,rst,s,r,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=0; #2; if(q!==0)$fatal(1,"Async reset failed"); @(negedge clk); #1; if(q!==0)$fatal(1,"Reset failed"); expected=0;
    @(posedge clk); rst=1;
    for(i=0;i<12;i=i+1) begin {s,r}=i; case({s,r}) 0:expected=expected; 1:expected=0; 2:expected=1; 3:expected=1'bx; endcase @(negedge clk); #1; if(q!==expected)$fatal(1,"Flip-flop mismatch"); @(posedge clk); end
    $display("PASS: lab6-q4");
    $finish;
  end
endmodule
```

## Lab 6 · A1 — T flip-flop, synchronous active-high reset

Synchronous active-high reset; falling clock edge. Reference solution; manual printed page 33.

### design.v

```verilog
// Lab 6, A1: T flip-flop, synchronous active-high reset
// Synchronous active-high reset; falling clock edge.
module lab6_a1_circuit(input clk,rst,t,output reg q); always @(negedge clk) if(rst) q<=0; else q<=q^t; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=1,rst=0,t=0; wire q; reg expected;
  integer i;
  lab6_a1_circuit dut(clk,rst,t,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2;  @(negedge clk); #1; if(q!==0)$fatal(1,"Reset failed"); expected=0;
    @(posedge clk); rst=0;
    for(i=0;i<12;i=i+1) begin {t}=i; expected=expected^t; @(negedge clk); #1; if(q!==expected)$fatal(1,"Flip-flop mismatch"); @(posedge clk); end
    $display("PASS: lab6-a1");
    $finish;
  end
endmodule
```

## Lab 6 · A2 — JK flip-flop, asynchronous active-low reset

Asynchronous active-low reset; rising clock edge. Reference solution; manual printed page 33.

### design.v

```verilog
// Lab 6, A2: JK flip-flop, asynchronous active-low reset
// Asynchronous active-low reset; rising clock edge.
module lab6_a2_circuit(input clk,rst,j,k,output reg q); always @(posedge clk or negedge rst) if(!rst) q<=0; else q<=(j&~q)|(~k&q); endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=1,j=0,k=0; wire q; reg expected;
  integer i;
  lab6_a2_circuit dut(clk,rst,j,k,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=0; #2; if(q!==0)$fatal(1,"Async reset failed"); @(posedge clk); #1; if(q!==0)$fatal(1,"Reset failed"); expected=0;
    @(negedge clk); rst=1;
    for(i=0;i<12;i=i+1) begin {j,k}=i; expected=(j&~expected)|(~k&expected); @(posedge clk); #1; if(q!==expected)$fatal(1,"Flip-flop mismatch"); @(negedge clk); end
    $display("PASS: lab6-a2");
    $finish;
  end
endmodule
```

## Lab 7 · S1 — Structural 4-bit register

Four D flip-flops. An active-high asynchronous reset is added to initialize simulation. Reference solution; manual printed page 36.

### design.v

```verilog
// Lab 7, S1: Structural 4-bit register
// Four D flip-flops. An active-high asynchronous reset is added to initialize simulation.
module lab7_s1_circuit(input clk,rst,input [3:0] data,output [3:0] q);
genvar k; generate for(k=0;k<4;k=k+1) begin:b lab7_s1_dff f(clk,rst,data[k],q[k]); end endgenerate
endmodule
module lab7_s1_dff(input clk,rst,d,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=d; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; reg [3:0] data; wire [3:0] q; reg [3:0] expected;
  integer i;
  lab7_s1_circuit dut(clk,rst,data,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
data=0; rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0;
 for(i=0;i<20;i=i+1) begin @(negedge clk); data=i; expected=data; @(posedge clk); #1; if(q!==expected)$fatal(1,"Register mismatch"); end
    $display("PASS: lab7-s1");
    $finish;
  end
endmodule
```

## Lab 7 · Q1 — Structural 6-bit shift register

Shift toward MSB; serial enters q[0], serial output is q[5]. An active-high asynchronous reset is added to initialize simulation. Reference solution; manual printed page 37.

### design.v

```verilog
// Lab 7, Q1: Structural 6-bit shift register
// Shift toward MSB; serial enters q[0], serial output is q[5]. An active-high asynchronous reset is added to initialize simulation.
module lab7_q1_circuit(input clk,rst,input serial,output [5:0] q);
lab7_q1_dff first(clk,rst,serial,q[0]); genvar k; generate for(k=1;k<6;k=k+1) begin:b lab7_q1_dff f(clk,rst,q[k-1],q[k]); end endgenerate
endmodule
module lab7_q1_dff(input clk,rst,d,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=d; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; reg serial; wire [5:0] q; reg [5:0] expected;
  integer i;
  lab7_q1_circuit dut(clk,rst,serial,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
serial=0; rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0;
 for(i=0;i<20;i=i+1) begin @(negedge clk); serial=i; expected={expected[4:0],serial}; @(posedge clk); #1; if(q!==expected)$fatal(1,"Register mismatch"); end
    $display("PASS: lab7-q1");
    $finish;
  end
endmodule
```

## Lab 7 · Q2 — N-bit parallel register

N defaults to 8; testbench width must match N. Added reset for deterministic initialization. Reference solution; manual printed page 37.

### design.v

```verilog
// Lab 7, Q2: N-bit parallel register
// N defaults to 8; testbench width must match N. Added reset for deterministic initialization.
module lab7_q2_circuit #(parameter N=8)(input clk,rst,input [N-1:0] d,output reg [N-1:0] q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=d; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; reg [7:0] d=0; wire [7:0] q;
  integer i;
  lab7_q2_circuit dut(clk,rst,d,q);
always #1 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==0)$fatal; #5; rst=0; for(i=0;i<256;i=i+1) begin @(negedge clk); d=i; @(posedge clk); #0.1; if(q!==d)$fatal; end
    $display("PASS: lab7-q2");
    $finish;
  end
endmodule
```

## Lab 7 · Q3 — Shift/load/complement/hold register

mode={Shift,Load}: 00 shifts left, 01 loads, 10 complements, 11 holds. An active-high asynchronous reset is added to initialize simulation. Reference solution; manual printed page 37.

### design.v

```verilog
// Lab 7, Q3: Shift/load/complement/hold register
// mode={Shift,Load}: 00 shifts left, 01 loads, 10 complements, 11 holds. An active-high asynchronous reset is added to initialize simulation.
module lab7_q3_circuit(input clk,rst,input [1:0] mode,input [3:0] data,input serial,output reg [3:0] q);
always @(posedge clk or posedge rst) if(rst)q<=0; else case(mode) 0:q<={q[2:0],serial}; 1:q<=data; 2:q<=~q; 3:q<=q; endcase
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; reg [1:0] mode; reg [3:0] data; reg serial; wire [3:0] q; reg [3:0] expected;
  integer i;
  lab7_q3_circuit dut(clk,rst,mode,data,serial,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
mode=0; data=0; serial=0; rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0;
 for(i=0;i<20;i=i+1) begin @(negedge clk); mode=i%4; data=i; serial=i%2; case(mode) 0:expected={expected[2:0],serial}; 1:expected=data; 2:expected=~expected; 3:expected=expected; endcase @(posedge clk); #1; if(q!==expected)$fatal(1,"Register mismatch"); end
    $display("PASS: lab7-q3");
    $finish;
  end
endmodule
```

## Lab 7 · A2 — Shift/parallel load/hold register

mode={Shift,Load}: 00 shifts left, 01 loads, 1X holds. An active-high asynchronous reset is added to initialize simulation. Reference solution; manual printed page 38.

### design.v

```verilog
// Lab 7, A2: Shift/parallel load/hold register
// mode={Shift,Load}: 00 shifts left, 01 loads, 1X holds. An active-high asynchronous reset is added to initialize simulation.
module lab7_a2_circuit(input clk,rst,input [1:0] mode,input [3:0] data,input serial,output reg [3:0] q);
always @(posedge clk or posedge rst) if(rst)q<=0; else case(mode) 0:q<={q[2:0],serial}; 1:q<=data; 2:q<=q; 3:q<=q; endcase
endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; reg [1:0] mode; reg [3:0] data; reg serial; wire [3:0] q; reg [3:0] expected;
  integer i;
  lab7_a2_circuit dut(clk,rst,mode,data,serial,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
mode=0; data=0; serial=0; rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0;
 for(i=0;i<20;i=i+1) begin @(negedge clk); mode=i%4; data=i; serial=i%2; case(mode) 0:expected={expected[2:0],serial}; 1:expected=data; 2:expected=expected; 3:expected=expected; endcase @(posedge clk); #1; if(q!==expected)$fatal(1,"Register mismatch"); end
    $display("PASS: lab7-a2");
    $finish;
  end
endmodule
```

## Lab 7 · A1 — N-bit shift register

N defaults to 8; shifts toward MSB. Asynchronous reset added. Reference solution; manual printed page 38.

### design.v

```verilog
// Lab 7, A1: N-bit shift register
// N defaults to 8; shifts toward MSB. Asynchronous reset added.
module lab7_a1_circuit #(parameter N=8)(input clk,rst,serial,output reg [N-1:0] q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(q<<1)|serial; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0,serial=0; wire [7:0] q; reg [7:0] expected;
  integer i;
  lab7_a1_circuit dut(clk,rst,serial,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; #5; rst=0; expected=0; for(i=0;i<24;i=i+1) begin @(negedge clk); serial=i%3==0; expected=(expected<<1)|serial; @(posedge clk); #1; if(q!==expected)$fatal; end
    $display("PASS: lab7-a1");
    $finish;
  end
endmodule
```

## Lab 8 · Q1 — Reduced state-table circuit using JK FFs

Equivalent groups: {a,c}=0, {b,e}=1, {d,h}=2, f=3, g=4. Output is Mealy (depends on current state and x). Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 41–42.

### design.v

```verilog
// Lab 8, Q1: Reduced state-table circuit using JK FFs
// Equivalent groups: {a,c}=0, {b,e}=1, {d,h}=2, f=3, g=4. Output is Mealy (depends on current state and x). Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab8_q1_circuit(input clk,rst,input x,output [2:0] q,output reg y);
reg [2:0] next; 
always @* begin next=q; y=0; case(q) 0:next=x?1:3; 1:next=x?0:2; 2:next=x?0:4; 3:next=x?1:3; 4:next=x?2:4; default:next=0; endcase case(q) 2:y=~x; 3:y=1; 4:y=x; default:y=0; endcase end
genvar k; generate for(k=0;k<3;k=k+1) begin:bits lab8_q1_jkff ff(clk,rst,(~q[k]&next[k]),(q[k]&~next[k]),q[k]); end endgenerate
endmodule
module lab8_q1_jkff(input clk,rst,j,k,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(j&~q)|(~k&q); endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] q; wire y; reg expected_y; reg [2:0] expected; reg x=0;
  integer i;
  lab8_q1_circuit dut(clk,rst,x,q,y);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==3'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk); x=((i*7+i/3)%11)>4; case(expected) 2:expected_y=~x; 3:expected_y=1; 4:expected_y=x; default:expected_y=0; endcase #1; if(y!==expected_y)$fatal(1,"Mealy output mismatch"); case(expected) 0:expected=x?1:3; 1:expected=x?0:2; 2:expected=x?0:4; 3:expected=x?1:3; 4:expected=x?2:4; default:expected=0; endcase @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab8-q1");
    $finish;
  end
endmodule
```

## Lab 8 · Q2 — State-diagram circuit using T FFs

Diagram transcribed: 00→01 on 0; 01→11 on 0 or 10 on 1; 10→11 on 0; 11→00 on 0; other 1 transitions hold. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 42.

### design.v

```verilog
// Lab 8, Q2: State-diagram circuit using T FFs
// Diagram transcribed: 00→01 on 0; 01→11 on 0 or 10 on 1; 10→11 on 0; 11→00 on 0; other 1 transitions hold. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab8_q2_circuit(input clk,rst,input x,output [1:0] q);
reg [1:0] next; 
always @* begin next=q;  case(q) 0:next=x?0:1; 1:next=x?2:3; 2:next=x?2:3; 3:next=x?3:0; endcase  end
genvar k; generate for(k=0;k<2;k=k+1) begin:bits lab8_q2_tff ff(clk,rst,(q[k]^next[k]),q[k]); end endgenerate
endmodule
module lab8_q2_tff(input clk,rst,t,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=q^t; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [1:0] q;  reg [1:0] expected; reg x=0;
  integer i;
  lab8_q2_circuit dut(clk,rst,x,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==2'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk); x=(i%7)>3; case(expected) 0:expected=x?0:1; 1:expected=x?2:3; 2:expected=x?2:3; 3:expected=x?3:0; endcase @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab8-q2");
    $finish;
  end
endmodule
```

## Lab 8 · A1 — Enabled two-bit up/down JK circuit

E=0 holds. E=1: x=1 counts up, x=0 counts down. Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 42.

### design.v

```verilog
// Lab 8, A1: Enabled two-bit up/down JK circuit
// E=0 holds. E=1: x=1 counts up, x=0 counts down. Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab8_a1_circuit(input clk,rst,input en,x,output [1:0] q);
reg [1:0] next; 
always @* begin next=q;  if(en) next=x?q+2'd1:q-2'd1;  end
genvar k; generate for(k=0;k<2;k=k+1) begin:bits lab8_a1_jkff ff(clk,rst,(~q[k]&next[k]),(q[k]&~next[k]),q[k]); end endgenerate
endmodule
module lab8_a1_jkff(input clk,rst,j,k,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(j&~q)|(~k&q); endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [1:0] q;  reg [1:0] expected; reg en=0,x=0;
  integer i;
  lab8_a1_circuit dut(clk,rst,en,x,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==2'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk); en=(i%5)!=0; x=(i%12)<6; if(en) expected=x?expected+2'd1:expected-2'd1; @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab8-a1");
    $finish;
  end
endmodule
```

## Lab 8 · A2 — State-diagram circuit using D FFs

Diagram states 001,100,011,010,000. Initial state is chosen as 001. Explicit D flip-flops; active-high asynchronous reset. Unused states recover to 1. Reference solution; manual printed page 43.

### design.v

```verilog
// Lab 8, A2: State-diagram circuit using D FFs
// Diagram states 001,100,011,010,000. Initial state is chosen as 001. Explicit D flip-flops; active-high asynchronous reset. Unused states recover to 1.
module lab8_a2_circuit(input clk,rst,input x,output [2:0] q);
reg [2:0] next; wire [2:0] physical; wire [2:0] encoded=next^3'd1; assign q=physical^3'd1;
always @* begin next=q;  case(q) 1:next=x?1:4; 4:next=x?2:3; 3:next=x?1:2; 2:next=x?2:0; 0:next=x?3:4; default:next=1; endcase  end
genvar k; generate for(k=0;k<3;k=k+1) begin:bits lab8_a2_dff ff(clk,rst,encoded[k],physical[k]); end endgenerate
endmodule
module lab8_a2_dff(input clk,rst,d,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=d; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] q;  reg [2:0] expected; reg x=0;
  integer i;
  lab8_a2_circuit dut(clk,rst,x,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==3'd1)$fatal(1,"Reset failed"); #5; rst=0; expected=1;
 for(i=0;i<80;i=i+1) begin @(negedge clk); x=(i%9)>4; case(expected) 1:expected=x?1:4; 4:expected=x?2:3; 3:expected=x?1:2; 2:expected=x?2:0; 0:expected=x?3:4; default:expected=1; endcase @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab8-a2");
    $finish;
  end
endmodule
```

## Lab 9 · S1 — 3-bit synchronous T counter (as printed)

The manual’s NAND connections implement a DOWN counter, not an up counter: 0,7,6,…,1. This preserves that printed behavior. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 46.

### design.v

```verilog
// Lab 9, S1: 3-bit synchronous T counter (as printed)
// The manual’s NAND connections implement a DOWN counter, not an up counter: 0,7,6,…,1. This preserves that printed behavior. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab9_s1_circuit(input clk,rst,output [2:0] q);
reg [2:0] next; 
always @* begin next=q;  next[0]=~q[0]; next[1]=q[1]^~q[0]; next[2]=q[2]^(~q[0]&~q[1]);  end
genvar k; generate for(k=0;k<3;k=k+1) begin:bits lab9_s1_tff ff(clk,rst,(q[k]^next[k]),q[k]); end endgenerate
endmodule
module lab9_s1_tff(input clk,rst,t,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=q^t; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] q;  reg [2:0] expected; 
  integer i;
  lab9_s1_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==3'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk);  expected=expected-3'd1; @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab9-s1");
    $finish;
  end
endmodule
```

## Lab 9 · Q1 — 4-bit ring counter

Reset seeds a single 1; 0001→0010→0100→1000. Reference solution; manual printed page 48.

### design.v

```verilog
// Lab 9, Q1: 4-bit ring counter
// Reset seeds a single 1; 0001→0010→0100→1000.
module lab9_q1_circuit(input clk,rst,output reg [3:0] q); always @(posedge clk or posedge rst) if(rst)q<=4'b0001; else q<={q[2:0],q[3]}; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [3:0] q; reg [3:0] expected;
  integer i;
  lab9_q1_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==1)$fatal; #5; rst=0; expected=1; for(i=0;i<20;i=i+1) begin @(negedge clk); expected={expected[2:0],expected[3]}; @(posedge clk); #1; if(q!==expected)$fatal; end
    $display("PASS: lab9-q1");
    $finish;
  end
endmodule
```

## Lab 9 · Q2 — 6-bit Johnson counter

12-state cycle, starting at 000000. Reference solution; manual printed page 48.

### design.v

```verilog
// Lab 9, Q2: 6-bit Johnson counter
// 12-state cycle, starting at 000000.
module lab9_q2_circuit(input clk,rst,output reg [5:0] q); always @(posedge clk or posedge rst) if(rst)q<=0; else q<={q[4:0],~q[5]}; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [5:0] q; reg [5:0] expected;
  integer i;
  lab9_q2_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0; for(i=0;i<36;i=i+1) begin @(negedge clk); expected={expected[4:0],~expected[5]}; @(posedge clk); #1; if(q!==expected)$fatal; end
    $display("PASS: lab9-q2");
    $finish;
  end
endmodule
```

## Lab 9 · Q3 — 4-bit ripple up counter, positive-edge T FFs

Each next positive-edge FF is clocked by the complement of the previous Q. Sample after ripple settles; no physical propagation delays are modeled. Reference solution; manual printed page 48.

### design.v

```verilog
// Lab 9, Q3: 4-bit ripple up counter, positive-edge T FFs
// Each next positive-edge FF is clocked by the complement of the previous Q. Sample after ripple settles; no physical propagation delays are modeled.
module lab9_q3_circuit(input clk,rst,output [3:0] q); lab9_q3_tff first(clk,rst,1'b1,q[0]); genvar k; generate for(k=1;k<4;k=k+1) begin:b lab9_q3_tff ff(~q[k-1],rst,1'b1,q[k]); end endgenerate endmodule
module lab9_q3_tff(input clk,rst,t,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=q^t; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [3:0] q; reg [3:0] expected;
  integer i;
  lab9_q3_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==0)$fatal; #5; rst=0; expected=0; for(i=0;i<40;i=i+1) begin @(negedge clk); expected=expected+1; @(posedge clk); #1; if(q!==expected)$fatal; end
    $display("PASS: lab9-q3");
    $finish;
  end
endmodule
```

## Lab 9 · A1 — 4-bit synchronous up/down JK counter

W=1 counts up, W=0 counts down. Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 48.

### design.v

```verilog
// Lab 9, A1: 4-bit synchronous up/down JK counter
// W=1 counts up, W=0 counts down. Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab9_a1_circuit(input clk,rst,input w,output [3:0] q);
reg [3:0] next; 
always @* begin next=q;  next=w?q+4'd1:q-4'd1;  end
genvar k; generate for(k=0;k<4;k=k+1) begin:bits lab9_a1_jkff ff(clk,rst,(~q[k]&next[k]),(q[k]&~next[k]),q[k]); end endgenerate
endmodule
module lab9_a1_jkff(input clk,rst,j,k,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(j&~q)|(~k&q); endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [3:0] q;  reg [3:0] expected; reg w=0;
  integer i;
  lab9_a1_circuit dut(clk,rst,w,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==4'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk); w=(i%40)<20; expected=w?expected+4'd1:expected-4'd1; @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab9-a1");
    $finish;
  end
endmodule
```

## Lab 9 · A2 — High output every fifth clock

Pulse stays high for one clock period after clocks 5,10,15,… Reference solution; manual printed page 48.

### design.v

```verilog
// Lab 9, A2: High output every fifth clock
// Pulse stays high for one clock period after clocks 5,10,15,…
module lab9_a2_circuit(input clk,rst,output reg [2:0] count,output reg pulse); always @(posedge clk or posedge rst) if(rst)begin count<=0; pulse<=0; end else if(count==4)begin count<=0; pulse<=1; end else begin count<=count+1'b1; pulse<=0; end endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] count; wire pulse;
  integer i;
  lab9_a2_circuit dut(clk,rst,count,pulse);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; #5; rst=0; for(i=1;i<=20;i=i+1) begin @(negedge clk); @(posedge clk); #1; if(pulse!==(i%5==0)||count!==(i%5))$fatal; end
    $display("PASS: lab9-a2");
    $finish;
  end
endmodule
```

## Lab 9 · A3 — Two-digit BCD counter

Two synchronous modulo-10 stages: 00 through 99, then 00. Reference solution; manual printed page 48.

### design.v

```verilog
// Lab 9, A3: Two-digit BCD counter
// Two synchronous modulo-10 stages: 00 through 99, then 00.
module lab9_a3_circuit(input clk,rst,output [3:0] tens,ones); wire rollover=ones==9; lab9_a3_mod10 low(clk,rst,1'b1,ones); lab9_a3_mod10 high(clk,rst,rollover,tens); endmodule
module lab9_a3_mod10(input clk,rst,en,output reg [3:0] q); always @(posedge clk or posedge rst) if(rst)q<=0; else if(en)q<=q==9?0:q+1'b1; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [3:0] tens,ones; integer expected;
  integer i;
  lab9_a3_circuit dut(clk,rst,tens,ones);
always #1 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #0.5; rst=0; expected=0; for(i=0;i<120;i=i+1)begin @(posedge clk); expected=(expected+1)%100; #0.1; if(tens*10+ones!=expected)$fatal; end
    $display("PASS: lab9-a3");
    $finish;
  end
endmodule
```

## Lab 10 · S1 — Sequence 0,1,2,4,5,6

Cycle: 0 → 1 → 2 → 4 → 5 → 6 → 0. Excitations are derived from next-state equations, never S=R=1. Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 51.

### design.v

```verilog
// Lab 10, S1: Sequence 0,1,2,4,5,6
// Cycle: 0 → 1 → 2 → 4 → 5 → 6 → 0. Excitations are derived from next-state equations, never S=R=1. Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab10_s1_circuit(input clk,rst,output [2:0] q);
reg [2:0] next; 
always @* begin next=q;  case(q) 0:next=1; 1:next=2; 2:next=4; 4:next=5; 5:next=6; 6:next=0; default:next=0; endcase  end
genvar k; generate for(k=0;k<3;k=k+1) begin:bits lab10_s1_jkff ff(clk,rst,(~q[k]&next[k]),(q[k]&~next[k]),q[k]); end endgenerate
endmodule
module lab10_s1_jkff(input clk,rst,j,k,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(j&~q)|(~k&q); endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] q;  reg [2:0] expected; reg [2:0] seq_values [0:5];
  integer i;
  lab10_s1_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==3'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk);  seq_values[0]=0; seq_values[1]=1; seq_values[2]=2; seq_values[3]=4; seq_values[4]=5; seq_values[5]=6; expected=seq_values[(i+1)%6]; @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab10-s1");
    $finish;
  end
endmodule
```

## Lab 10 · Q1 — Modulo-7 sequence with JK FFs

Cycle: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 0. Excitations are derived from next-state equations, never S=R=1. Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 52.

### design.v

```verilog
// Lab 10, Q1: Modulo-7 sequence with JK FFs
// Cycle: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 0. Excitations are derived from next-state equations, never S=R=1. Explicit JK flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab10_q1_circuit(input clk,rst,output [2:0] q);
reg [2:0] next; 
always @* begin next=q;  case(q) 0:next=1; 1:next=2; 2:next=3; 3:next=4; 4:next=5; 5:next=6; 6:next=0; default:next=0; endcase  end
genvar k; generate for(k=0;k<3;k=k+1) begin:bits lab10_q1_jkff ff(clk,rst,(~q[k]&next[k]),(q[k]&~next[k]),q[k]); end endgenerate
endmodule
module lab10_q1_jkff(input clk,rst,j,k,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=(j&~q)|(~k&q); endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] q;  reg [2:0] expected; reg [2:0] seq_values [0:6];
  integer i;
  lab10_q1_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==3'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk);  seq_values[0]=0; seq_values[1]=1; seq_values[2]=2; seq_values[3]=3; seq_values[4]=4; seq_values[5]=5; seq_values[6]=6; expected=seq_values[(i+1)%7]; @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab10-q1");
    $finish;
  end
endmodule
```

## Lab 10 · Q2 — Sequence 1,2,3,0,7,6,5 with SR FFs

Cycle: 1 → 2 → 3 → 0 → 7 → 6 → 5 → 1. Excitations are derived from next-state equations, never S=R=1. Explicit SR flip-flops; active-high asynchronous reset. Unused states recover to 1. Reference solution; manual printed page 52.

### design.v

```verilog
// Lab 10, Q2: Sequence 1,2,3,0,7,6,5 with SR FFs
// Cycle: 1 → 2 → 3 → 0 → 7 → 6 → 5 → 1. Excitations are derived from next-state equations, never S=R=1. Explicit SR flip-flops; active-high asynchronous reset. Unused states recover to 1.
module lab10_q2_circuit(input clk,rst,output [2:0] q);
reg [2:0] next; wire [2:0] physical; wire [2:0] encoded=next^3'd1; assign q=physical^3'd1;
always @* begin next=q;  case(q) 1:next=2; 2:next=3; 3:next=0; 0:next=7; 7:next=6; 6:next=5; 5:next=1; default:next=1; endcase  end
genvar k; generate for(k=0;k<3;k=k+1) begin:bits lab10_q2_srff ff(clk,rst,(~physical[k]&encoded[k]),(physical[k]&~encoded[k]),physical[k]); end endgenerate
endmodule
module lab10_q2_srff(input clk,rst,s,r,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else case({s,r}) 0:q<=q; 1:q<=0; 2:q<=1; 3:q<=1'bx; endcase endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] q;  reg [2:0] expected; reg [2:0] seq_values [0:6];
  integer i;
  lab10_q2_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==3'd1)$fatal(1,"Reset failed"); #5; rst=0; expected=1;
 for(i=0;i<80;i=i+1) begin @(negedge clk);  seq_values[0]=1; seq_values[1]=2; seq_values[2]=3; seq_values[3]=0; seq_values[4]=7; seq_values[5]=6; seq_values[6]=5; expected=seq_values[(i+1)%7]; @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab10-q2");
    $finish;
  end
endmodule
```

## Lab 10 · Q3 — Sequence 0,1,3,7,6,4 with T FFs

Cycle: 0 → 1 → 3 → 7 → 6 → 4 → 0. Excitations are derived from next-state equations, never S=R=1. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 52.

### design.v

```verilog
// Lab 10, Q3: Sequence 0,1,3,7,6,4 with T FFs
// Cycle: 0 → 1 → 3 → 7 → 6 → 4 → 0. Excitations are derived from next-state equations, never S=R=1. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab10_q3_circuit(input clk,rst,output [2:0] q);
reg [2:0] next; 
always @* begin next=q;  case(q) 0:next=1; 1:next=3; 3:next=7; 7:next=6; 6:next=4; 4:next=0; default:next=0; endcase  end
genvar k; generate for(k=0;k<3;k=k+1) begin:bits lab10_q3_tff ff(clk,rst,(q[k]^next[k]),q[k]); end endgenerate
endmodule
module lab10_q3_tff(input clk,rst,t,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=q^t; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] q;  reg [2:0] expected; reg [2:0] seq_values [0:5];
  integer i;
  lab10_q3_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==3'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk);  seq_values[0]=0; seq_values[1]=1; seq_values[2]=3; seq_values[3]=7; seq_values[4]=6; seq_values[5]=4; expected=seq_values[(i+1)%6]; @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab10-q3");
    $finish;
  end
endmodule
```

## Lab 10 · A1 — 12-state non-binary T counter

Cycle: 0 → 1 → 2 → 5 → 4 → 6 → 8 → 9 → 12 → 11 → 13 → 15 → 0. Excitations are derived from next-state equations, never S=R=1. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 52.

### design.v

```verilog
// Lab 10, A1: 12-state non-binary T counter
// Cycle: 0 → 1 → 2 → 5 → 4 → 6 → 8 → 9 → 12 → 11 → 13 → 15 → 0. Excitations are derived from next-state equations, never S=R=1. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab10_a1_circuit(input clk,rst,output [3:0] q);
reg [3:0] next; 
always @* begin next=q;  case(q) 0:next=1; 1:next=2; 2:next=5; 5:next=4; 4:next=6; 6:next=8; 8:next=9; 9:next=12; 12:next=11; 11:next=13; 13:next=15; 15:next=0; default:next=0; endcase  end
genvar k; generate for(k=0;k<4;k=k+1) begin:bits lab10_a1_tff ff(clk,rst,(q[k]^next[k]),q[k]); end endgenerate
endmodule
module lab10_a1_tff(input clk,rst,t,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=q^t; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [3:0] q;  reg [3:0] expected; reg [3:0] seq_values [0:11];
  integer i;
  lab10_a1_circuit dut(clk,rst,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==4'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk);  seq_values[0]=0; seq_values[1]=1; seq_values[2]=2; seq_values[3]=5; seq_values[4]=4; seq_values[5]=6; seq_values[6]=8; seq_values[7]=9; seq_values[8]=12; seq_values[9]=11; seq_values[10]=13; seq_values[11]=15; expected=seq_values[(i+1)%12]; @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab10-a1");
    $finish;
  end
endmodule
```

## Lab 10 · A2 — Controlled non-binary up/down T counter

w=0: 0→2→3→4→6→0; w=1 reverses the same cycle. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0. Reference solution; manual printed page 52.

### design.v

```verilog
// Lab 10, A2: Controlled non-binary up/down T counter
// w=0: 0→2→3→4→6→0; w=1 reverses the same cycle. Explicit T flip-flops; active-high asynchronous reset. Unused states recover to 0.
module lab10_a2_circuit(input clk,rst,input w,output [2:0] q);
reg [2:0] next; 
always @* begin next=q;  case(q) 0:next=w?6:2; 2:next=w?0:3; 3:next=w?2:4; 4:next=w?3:6; 6:next=w?4:0; default:next=0; endcase  end
genvar k; generate for(k=0;k<3;k=k+1) begin:bits lab10_a2_tff ff(clk,rst,(q[k]^next[k]),q[k]); end endgenerate
endmodule
module lab10_a2_tff(input clk,rst,t,output reg q); always @(posedge clk or posedge rst) if(rst) q<=0; else q<=q^t; endmodule
```

### testbench.v

```verilog
`timescale 1ns/1ps
module tb;
reg clk=0,rst=0; wire [2:0] q;  reg [2:0] expected; reg w=0;
  integer i;
  lab10_a2_circuit dut(clk,rst,w,q);
always #5 clk=~clk;
  initial begin
    $dumpfile("signal.vcd");
    $dumpvars(0, tb);
rst=1; #2; if(q!==3'd0)$fatal(1,"Reset failed"); #5; rst=0; expected=0;
 for(i=0;i<80;i=i+1) begin @(negedge clk); w=i>=40; case(expected) 0:expected=w?6:2; 2:expected=w?0:3; 3:expected=w?2:4; 4:expected=w?3:6; 6:expected=w?4:0; default:expected=0; endcase @(posedge clk); #1; if(q!==expected)$fatal(1,"State mismatch at cycle %0d",i); end
    $display("PASS: lab10-a2");
    $finish;
  end
endmodule
```
