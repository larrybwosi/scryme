package tech.scryme.app.util

object CurrencyUtils {

    fun getSymbol(currencyCode: String?): String {
        return when (currencyCode?.uppercase()) {
            "USD" -> "$"
            "EUR" -> "€"
            "GBP" -> "£"
            "KES" -> "KSh"
            "NGN" -> "₦"
            "JPY" -> "¥"
            "CAD" -> "CA$"
            "AUD" -> "A$"
            "INR" -> "₹"
            "GHS" -> "GH₵"
            "ZAR" -> "R"
            "UGX" -> "UGX"
            "TZS" -> "TZS"
            "RWF" -> "RF"
            "ETB" -> "Br"
            null, "" -> "$"
            else -> currencyCode
        }
    }

    fun formatAmount(amount: Double, currencyCode: String? = "USD", customSymbol: String? = null): String {
        val symbol = customSymbol?.ifBlank { null } ?: getSymbol(currencyCode)
        val formatted = String.format("%,.2f", amount)
        return "$symbol$formatted"
    }

    fun formatAmountString(amountText: String, currencyCode: String? = "USD", customSymbol: String? = null): String {
        val symbol = customSymbol?.ifBlank { null } ?: getSymbol(currencyCode)
        val cleanText = amountText.replace(Regex("[^0-9.]"), "")
        val number = cleanText.toDoubleOrNull()
        return if (number != null) {
            val formatted = String.format("%,.2f", number)
            "$symbol$formatted"
        } else {
            "$symbol$amountText"
        }
    }
}
