// Rasterizes an SVG string to a PNG data URL at a high pixel density.
//
// The naive approach — load the SVG into an <img> at its default size, then
// draw that onto a bigger canvas — blurs the output, because the browser
// rasterizes the SVG into a bitmap at its natural (small) size first and the
// canvas draw just stretches that bitmap. Setting the SVG's own width/height
// to the target size *before* rasterizing makes the browser render the vector
// natively at that resolution, which is what actually produces a crisp image.
export async function svgToPngDataUrl(svgString, { scale = 3, background = '#ffffff' } = {}) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, 'image/svg+xml')
  const svgEl = doc.documentElement

  const viewBox = svgEl.getAttribute('viewBox')
  let naturalWidth = parseFloat(svgEl.getAttribute('width')) || 0
  let naturalHeight = parseFloat(svgEl.getAttribute('height')) || 0
  if ((!naturalWidth || !naturalHeight) && viewBox) {
    const parts = viewBox.split(/\s+/).map(Number)
    naturalWidth = naturalWidth || parts[2] || 600
    naturalHeight = naturalHeight || parts[3] || 400
  }
  naturalWidth = naturalWidth || 600
  naturalHeight = naturalHeight || 400

  const targetWidth = Math.round(naturalWidth * scale)
  const targetHeight = Math.round(naturalHeight * scale)
  svgEl.setAttribute('width', String(targetWidth))
  svgEl.setAttribute('height', String(targetHeight))

  const serialized = new XMLSerializer().serializeToString(svgEl)
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`

  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = dataUri
  })

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return {
    dataUrl: canvas.toDataURL('image/png'),
    naturalWidth,
    naturalHeight,
  }
}
