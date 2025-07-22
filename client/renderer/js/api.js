export async function postData(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
  
    if (!res.ok) {
      const errorData = isJson ? await res.json() : await res.text();
      const errorMessage = isJson ? errorData.message || 'Unknown error' : errorData;
      throw new Error(errorMessage);
    }
  
    return isJson ? res.json() : res.text();
  }
  