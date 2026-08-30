// Small script to test the Next.js API route via programmatic local request

async function testFetchRoutine() {
  console.log('Sending request to http://localhost:3000/api/schedule with Roll: 2330001');
  try {
    const res = await fetch('http://localhost:3000/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNumber: '2330001' })
    });
    
    // We expect a connection refused if standard Next.js dev server isn't running.
    if (!res.ok) {
        console.log("Server responded with: ", res.status, res.statusText);
        const text = await res.text();
        console.log(text);
        return;
    }
    const data = await res.json();
    console.log("--- SUCCESS! Data received ---\n");
    console.log("Student:", data.student);
    console.log(`Found ${data.schedule.length} schedule entries.`);
    console.log("Sample Monday Morning Entry:", data.schedule.find((s:any) => s.day === 'MON'));

  } catch (err: any) {
    console.warn("Could not reach API. Please ensure 'npm run dev' is running in another terminal:", err.message);
  }
}

testFetchRoutine();
