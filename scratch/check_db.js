console.log("Env keys:", Object.keys(process.env).filter(k => k.toLowerCase().includes('supabase') || k.toLowerCase().includes('service')));
