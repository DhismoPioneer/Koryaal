export function parseWhatsAppReport(message, selectedPaymentMethod = 'Not Provided') {
  const lines = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const paymentMethod = detectPaymentMethod(message, selectedPaymentMethod)

  let providedTotal = null
  const records = []

  for (const line of lines) {
    const lower = line.toLowerCase().trim()

    // Payment line should not become a transaction
    if (
      lower.startsWith('payment') ||
      lower.startsWith('paid') ||
      lower.startsWith('method') ||
      lower.startsWith('habka') ||
      lower.startsWith('lacagta') ||
      lower.includes('payment:') ||
      lower.includes('method:') ||
      lower.includes('paid by')
    ) {
      continue
    }

    // Total line should only be used for verification
    if (
      lower.includes('total') ||
      lower.includes('total 🟰') ||
      lower.includes('isku dar') ||
      lower.includes('wadarta')
    ) {
      const totalMatch = line.match(/(\d+(\.\d+)?)/)
      if (totalMatch) {
        providedTotal = Number(totalMatch[1])
      }
      continue
    }

    const record = parseTransactionLine(line, paymentMethod)

    if (record) {
      records.push(record)
    }
  }

  const calculatedTotal = Number(
    records.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)
  )

  const difference =
    providedTotal !== null ? Number((providedTotal - calculatedTotal).toFixed(2)) : null

  return {
    provided_total: providedTotal,
    calculated_total: calculatedTotal,
    difference,
    total_status: providedTotal === null ? 'not_provided' : (difference === 0 ? 'matched' : 'mismatch'),
    payment_method: paymentMethod,
    records,
  }
}

function detectPaymentMethod(message, selectedPaymentMethod) {
  const text = message.toLowerCase()

  if (
    text.includes('e-dahab') ||
    text.includes('edahab') ||
    text.includes('e dahab') ||
    text.includes('dahab')
  ) {
    return 'E-Dahab'
  }

  if (text.includes('evc') || text.includes('evc plus')) {
    return 'EVC Plus'
  }

  if (text.includes('bank') || text.includes('account') || text.includes('transfer')) {
    return 'Bank'
  }

  if (text.includes('cash') || text.includes('kaash')) {
    return 'Cash'
  }

  return selectedPaymentMethod || 'Not Provided'
}

function parseTransactionLine(line, paymentMethod) {
  const clean = normalizeLine(line)

  // Format: 5 fuundi x15.5 = 77.5
  const qtyRateAmount = clean.match(
    /^(\d+(\.\d+)?)\s+(.+?)\s*x\s*(\d+(\.\d+)?)\s*=\s*(\d+(\.\d+)?)/i
  )

  if (qtyRateAmount) {
    const quantity = Number(qtyRateAmount[1])
    const description = qtyRateAmount[3].trim()
    const unitPrice = Number(qtyRateAmount[4])
    const amount = Number(qtyRateAmount[6])
    return quantityRateRecord(description, quantity, unitPrice, amount, paymentMethod)
  }

  // Format: fuundi 5 x 10 = 50
  const descQtyRateAmount = clean.match(
    /^(.+?)\s+(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)\s*=\s*(\d+(\.\d+)?)/i
  )

  if (descQtyRateAmount) {
    const description = descQtyRateAmount[1].trim()
    const quantity = Number(descQtyRateAmount[2])
    const unitPrice = Number(descQtyRateAmount[4])
    const amount = Number(descQtyRateAmount[6])
    return quantityRateRecord(description, quantity, unitPrice, amount, paymentMethod)
  }

  // Format: matoor = 35
  const equalsAmount = clean.match(/^(.+?)\s*=\s*(\d+(\.\d+)?)/i)

  if (equalsAmount) {
    const description = equalsAmount[1].trim()
    const amount = Number(equalsAmount[2])
    const detected = detectCategory(description)

    return {
      type: 'expense',
      category: detected.category,
      description,
      quantity: null,
      unit_price: null,
      amount,
      currency: 'USD',
      payment_method: paymentMethod,
      needs_review: detected.needs_review,
      review_reason: detected.review_reason,
      category_confidence: detected.confidence,
    }
  }

  // Format: Matoor 8
  const wordThenAmount = clean.match(/^([a-zA-Z\u0600-\u06FF\s]+)\s+(\d+(\.\d+)?)$/i)

  if (wordThenAmount) {
    const description = wordThenAmount[1].trim()
    const amount = Number(wordThenAmount[2])
    const detected = detectCategory(description)

    return {
      type: 'expense',
      category: detected.category,
      description,
      quantity: null,
      unit_price: null,
      amount,
      currency: 'USD',
      payment_method: paymentMethod,
      needs_review: true,
      review_reason:
        detected.needs_review
          ? detected.review_reason
          : "Line does not include '=' or quantity/rate format.",
      category_confidence: detected.confidence,
    }
  }

  // Format: 15 farsamo yaqaan pom
  const amountThenWords = clean.match(/^(\d+(\.\d+)?)\s+(.+)$/i)

  if (amountThenWords) {
    const amount = Number(amountThenWords[1])
    const description = amountThenWords[3].trim()
    const detected = detectCategory(description, { amountBeforeDescription: true })

    return {
      type: 'expense',
      category: detected.category,
      description,
      quantity: null,
      unit_price: null,
      amount,
      currency: 'USD',
      payment_method: paymentMethod,
      needs_review: true,
      review_reason:
        detected.needs_review
          ? detected.review_reason
          : 'Amount appears before description; confirm meaning.',
      category_confidence: detected.confidence,
    }
  }

  const detected = detectCategory(clean)

  return {
    type: 'expense',
    category: detected.category,
    description: clean,
    quantity: null,
    unit_price: null,
    amount: 0,
    currency: 'USD',
    payment_method: paymentMethod,
    needs_review: true,
    review_reason: detected.review_reason || 'Could not confidently parse this line.',
    category_confidence: detected.confidence,
  }
}

function quantityRateRecord(description, quantity, unitPrice, amount, paymentMethod) {
  const detected = detectCategory(description, { hasQuantityRate: true })
  const expectedAmount = Number((quantity * unitPrice).toFixed(2))
  const actualAmount = Number(amount.toFixed(2))
  const hasMathError = Math.abs(expectedAmount - actualAmount) > 0.01
  const needsCategoryReview = detected.needs_review && detected.category === 'other'

  return {
    type: 'expense',
    category: detected.category,
    description,
    quantity,
    unit_price: unitPrice,
    amount,
    expected_amount: expectedAmount,
    currency: 'USD',
    payment_method: paymentMethod,
    needs_review: hasMathError || needsCategoryReview,
    calculation_error: hasMathError,
    review_reason: hasMathError
      ? `Wrong calculation: ${quantity} x ${unitPrice} should be ${expectedAmount}, not ${amount}.`
      : (needsCategoryReview ? detected.review_reason : null),
    category_confidence: detected.confidence,
  }
}
function detectCategory(description = '', context = {}) {
  const text = normalizeText(description)

  const categoryRules = [
    {
      category: 'labor',
      confidence: 0.95,
      words: [
        // Somali construction labor
        'fuundi',
        'fundi',
        'shaqaale',
        'shaqale',
        'shaqaalo',
        'shaqaalooyin',
        'feeryoole',
        'feer yole',
        'muruqmaal',
        'farsamo yaqaan',
        'farsamo',
        'nijaare',
        'nijaar',
        'rinjiile',
        'koronto yaqaan',
        'koronto',
        'biyo geliye',
        'tuubiste',
        'albaab sameeye',
        'window fixer',
        'dhise',
        'dhismo',
        'mason',
        'worker',
        'labor',
        'labour',
        'technician',
        'contractor',
        'installer',
        'plumber',
        'electrician',
        'painter',
        'carpenter',
        'welder',
        'tiler',
        'helper',
        'site worker',
      ],
    },
    {
      category: 'material',
      confidence: 0.95,
      words: [
        // Construction materials
        'cement',
        'sibidh',
        'sibidhka',
        'ciid',
        'dhagax',
        'jaay',
        'blocks',
        'block',
        'buluug',
        'bir',
        'steel',
        'rebar',
        'tile',
        'tiles',
        'marble',
        'granite',
        'paint',
        'rinji',
        'wood',
        'alwaax',
        'timber',
        'pipe',
        'pvc',
        'wire',
        'cable',
        'nails',
        'musbaar',
        'glass',
        'sand',
        'gravel',
        'gypsum',
        'ceiling board',
        'adhesive',
        'glue',
        'silicone',
        'screw',
        'hinge',
        'door lock',
        'lock',
        'cement board',
      ],
    },
    {
      category: 'equipment',
      confidence: 0.9,
      words: [
        'matoor',
        'generator',
        'machine',
        'drill',
        'hammer',
        'compressor',
        'excavator',
        'mixer',
        'scaffold',
        'ladder',
        'wheelbarrow',
        'qalab',
        'kirada qalab',
        'equipment',
        'tool',
        'tools',
        'rental',
      ],
    },
    {
      category: 'transport',
      confidence: 0.9,
      words: [
        'transport',
        'transportation',
        'gaari',
        'baabuur',
        'truck',
        'pickup',
        'xamuul',
        'rar',
        'rarid',
        'delivery',
        'qaadis',
        'safari',
        'loading',
        'unloading',
        '搬',
      ],
    },
    {
      category: 'fuel',
      confidence: 0.9,
      words: [
        'fuel',
        'shidaal',
        'naafto',
        'petrol',
        'diesel',
        'gasoline',
        'oil',
        'saliid matoor',
      ],
    },
    {
      category: 'food',
      confidence: 0.85,
      words: [
        'cunto',
        'qado',
        'quraac',
        'casho',
        'biyo',
        'shaah',
        'buskut',
        'raashin',
        'lunch',
        'breakfast',
        'dinner',
        'water',
        'tea',
        'drinks',
        'meal',
      ],
    },
    {
      category: 'design',
      confidence: 0.9,
      words: [
        // Interior/design studio
        'design',
        'interior',
        '3d',
        'render',
        'rendering',
        'concept',
        'moodboard',
        'mood board',
        'layout',
        'floor plan',
        'plan',
        'drawing',
        'cad',
        'autocad',
        'sketchup',
        'visualization',
        'boq',
        'quotation',
        'measurement',
        'site measurement',
      ],
    },
    {
      category: 'furniture',
      confidence: 0.9,
      words: [
        'sofa',
        'chair',
        'table',
        'desk',
        'cabinet',
        'wardrobe',
        'shelf',
        'bed',
        'mattress',
        'curtain',
        'blind',
        'furniture',
        'fadhiga',
        'kursi',
        'miis',
        'armaajo',
        'sariir',
        'daah',
      ],
    },
    {
      category: 'decor',
      confidence: 0.88,
      words: [
        'decor',
        'decoration',
        'wallpaper',
        'mirror',
        'frame',
        'art',
        'carpet',
        'rug',
        'lighting',
        'chandelier',
        'lamp',
        'accessory',
        'plant',
        'vase',
        'wall panel',
        'panel',
      ],
    },
    {
      category: 'finishing',
      confidence: 0.88,
      words: [
        'finishing',
        'ceiling',
        'gypsum ceiling',
        'painting',
        'polish',
        'installation',
        'fixing',
        'flooring',
        'tiling',
        'plaster',
        'plastering',
        'aluminum',
        'windows',
        'doors',
        'albaab',
        'daaqad',
      ],
    },
    {
      category: 'payment',
      confidence: 0.9,
      words: [
        'advance',
        'hormaris',
        'lacag siin',
        'payment',
        'paid',
        'invoice',
        'biil',
        'qarash',
        'installment',
        'deposit',
        'balance',
        'remaining payment',
      ],
    },
    {
      category: 'service',
      confidence: 0.82,
      words: [
        'service',
        'inspection',
        'permit',
        'license',
        'cleaning',
        'security',
        'ilaalo',
        'kormeer',
        'consultation',
        'supervision',
        'maintenance',
        'repair',
        'testing',
        'survey',
      ],
    },
    {
      category: 'admin',
      confidence: 0.8,
      words: [
        'printing',
        'stationery',
        'paper',
        'internet',
        'phone',
        'airtime',
        'office',
        'admin',
        'document',
        'copy',
        'photocopy',
        'scan',
        'stamp',
      ],
    },
  ]

  for (const rule of categoryRules) {
    if (rule.words.some((word) => text.includes(normalizeText(word)))) {
      return {
        category: rule.category,
        confidence: rule.confidence,
        needs_review: false,
        review_reason: null,
      }
    }
  }

  // Smart fallback 1: if it looks like people/workers
  if (/\d+\s*(qof|nin|rag|haween|person|people|worker|workers|staff)/i.test(text)) {
    return {
      category: 'labor',
      confidence: 0.72,
      needs_review: true,
      review_reason: 'Looks like labor/staff count, but keyword is new.',
    }
  }

  // Smart fallback 2: Somali profession pattern
  if (
    text.includes('yaqaan') ||
    text.includes('le') ||
    text.includes('sameeye') ||
    text.includes('geliye')
  ) {
    return {
      category: 'labor',
      confidence: 0.7,
      needs_review: true,
      review_reason: 'Looks like a worker/professional title. Please confirm.',
    }
  }

  // Smart fallback 3: quantity x rate usually means labor/service/material, but labor is safer for unknown site messages
  if (context.hasQuantityRate || (text.includes('x') && /\d/.test(text))) {
    return {
      category: 'labor',
      confidence: 0.65,
      needs_review: true,
      review_reason: 'Has quantity x rate pattern. Please confirm category.',
    }
  }

  // Smart fallback 4: amount before description is often payment/labor note
  if (context.amountBeforeDescription) {
    return {
      category: 'service',
      confidence: 0.55,
      needs_review: true,
      review_reason: 'Amount appears before description; category needs confirmation.',
    }
  }

  return {
    category: 'other',
    confidence: 0.3,
    needs_review: true,
    review_reason: 'Unknown item. Please review and add keyword if repeated.',
  }
}

function normalizeLine(line = '') {
  return String(line)
    .replace(/🟰/g, '=')
    .replace(/×/g, 'x')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeText(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

