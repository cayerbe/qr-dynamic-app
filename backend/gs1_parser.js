const { DigitalLink } = require('digital-link.js');

try {
  const uri = process.argv[2];
  const dl = DigitalLink(uri);
  
  const gtinObj = dl.getIdentifier('01');
  const gtin = gtinObj ? gtinObj['01'] : null;
  const lot = dl.getKeyQualifier('10');
  const serial = dl.getKeyQualifier('21');
  
  const result = {
    valid: dl.isValid(),
    gtin: gtin || null,
    lot: lot || null,
    serial: serial || null,
    domain: dl.getDomain()
  };
  
  console.log(JSON.stringify(result));
} catch (error) {
  console.log(JSON.stringify({ valid: false, error: error.message }));
}
