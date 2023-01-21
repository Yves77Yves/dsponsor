// Fonction pour trouver les nombres premiers inférieurs à un nombre donné
function eratostheneSieve(n) {
  // Initialiser un tableau de booléens à False
  const prime = new Array(n+1).fill(false);
  // Mettre à True les nombres premiers
  let p = 2;
  let q = 1;
  while (p * p <= n) {
    // Si le nombre est marqué comme premier
    if (prime[p] === false) {
      // Mettre à True les multiples de ce nombre
      for (let i = 2 * p; i <= n; i += p) {
        prime[i] = true;
      }
    }
    p += 1;
    q += 1;
  }
  // Afficher les nombres premiers
  for (let p = 2; p < n; p++) {
    if (!prime[p]) {
      console.log(p);
    }
  }
  
  console.log('*****');
  console.log(q);
}

eratostheneSieve(100);
