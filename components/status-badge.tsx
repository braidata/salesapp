export default function StatusBadge({ status, description }) {
  let bgColor = "bg-gray-600/20"
  let textColor = "text-gray-100"

  switch (status) {
    case "handling":
      bgColor = "bg-blue-500/20"
      textColor = "text-blue-300"
      break
    case "ready-for-handling":
      bgColor = "bg-yellow-500/20"
      textColor = "text-yellow-300"
      break
    case "invoiced":
      bgColor = "bg-green-500/20"
      textColor = "text-green-300"
      break
    case "canceled":
      bgColor = "bg-red-500/20"
      textColor = "text-red-300"
      break
    case "delivered":
      bgColor = "bg-purple-500/20"
      textColor = "text-purple-300"
      break
    default:
      bgColor = "bg-gray-500/20"
      textColor = "text-gray-300"
  }

  return (
    <div className={`px-4 py-2 rounded-full ${bgColor} ${textColor} font-medium text-sm inline-flex items-center`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${textColor.replace("text", "bg")}`}></span>
      {description || status}
    </div>
  )
}

