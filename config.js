// Fill these in once you create your Gumroad product.
// 1. Create a product on Gumroad (e.g. "Custom Cross Stitch Pattern PDF").
// 2. In the product's Settings, enable "Generate a unique license key per sale".
// 3. Copy the product permalink (the part after gumroad.com/l/) below.
// 4. Copy the Product ID (shown in the product's edit URL or via the Gumroad API) below.
window.APP_CONFIG = {
  gumroadPermalink: 'YOUR-GUMROAD-PERMALINK', // e.g. 'stitchmade-custom-pattern'
  gumroadProductId: 'YOUR-GUMROAD-PRODUCT-ID',
  price: '$9',

  // Separate Gumroad product for the automated pet portrait tool (set up
  // the same way: create a product, turn on unique license keys per sale).
  gumroadPetPermalink: 'YOUR-GUMROAD-PET-PERMALINK',
  gumroadPetProductId: 'YOUR-GUMROAD-PET-PRODUCT-ID',
  petPrice: '$12',

  // Create a Google Form with fields like: pet photo upload, pet name,
  // your name, email, preferred fabric/frame size, deadline, notes.
  // Paste the form's public URL here once it exists. This is the fallback
  // link for fully custom/hand-designed requests, not the automated tool.
  customPetFormUrl: 'https://forms.gle/YOUR-FORM-ID',
};
