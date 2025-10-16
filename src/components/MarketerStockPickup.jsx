// src/components/MarketerStockPickup.jsx
import React, { useState, useEffect, useRef } from 'react'
import api from '../api'
import AlertDialog from './ui/alert-dialog'
import { useAlert } from '../hooks/useAlert'
import { formatCurrency } from '../utils/currency'
import TransferPopover from './TransferPopover'
import { io } from 'socket.io-client'

// Import mobile-first components
import MobileTable from "./MobileTable";
import MobileCard from "./MobileCard";
import MobileSearch from "./MobileSearch";

// Import mobile design system
// // import "../styles/mobile-design-system.css"; // Removed - file doesn't exist // Removed - file doesn't exist

export default function MarketerStockPickup() {
  const [dealers, setDealers]               = useState([])
  const [products, setProducts]             = useState([])
  const [selectedDealer, setSelectedDealer] = useState('')
  const [allowanceInfo, setAllowanceInfo]   = useState({
    allowance: 1,           // 1 or up to 3 once approved
    request_status: null,   // "pending" | "approved" | "rejected" | null
    next_request_at: null   // timestamp when next request is allowed
  })
  const [lines, setLines]                   = useState([{ product_id: '' }])
  const [pickups, setPickups]               = useState([])
  const [now, setNow]                       = useState(Date.now())
   // track the previous request_status
  const prevStatusRef  = useRef(allowanceInfo.request_status)
  const [transferringId, setTransferringId] = useState(null)
  const [transferTarget, setTransferTarget] = useState('')
  const [hasConfirmedOrders, setHasConfirmedOrders] = useState(false)
  const [additionalPickupEligibility, setAdditionalPickupEligibility] = useState({
    eligible: false,
    hasConfirmedOrder: false,
    hasPendingCompletion: false,
    hasPendingRequest: false,
    cooldownActive: false,
    cooldownUntil: null,
    message: ''
  })
  const [showTransferPopover, setShowTransferPopover] = useState(false)
  const [currentStockId, setCurrentStockId] = useState(null)
  const [currentUserLocation, setCurrentUserLocation] = useState('')
  const [eligibilityInfo, setEligibilityInfo] = useState({
    eligible: false,
    hasActiveStock: false,
    hasPendingReturn: false,
    hasPendingTransfer: false,
    hasPendingOrder: false,
    isLocked: false,
    message: ''
  })
  const [accountStatus, setAccountStatus] = useState({
    blocked: false,
    violationCount: 0,
    blockingReason: null
  })
  
  // Alert dialog hook
  const { alert, showSuccess, showError, showInfo, showWarning, showConfirmation, hideAlert } = useAlert()

  // 1s tick for live countdowns
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // WebSocket for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token }
    })

    // Listen for additional pickup request updates
    socket.on('additional_pickup_request_approved', (data) => {
      console.log('Additional pickup request approved:', data)
      refreshAllowance()
      checkAdditionalPickupEligibility()
    })

    socket.on('additional_pickup_request_rejected', (data) => {
      console.log('Additional pickup request rejected:', data)
      refreshAllowance()
      checkAdditionalPickupEligibility()
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Initial load: dealers, allowance, pickups, confirmed orders
  useEffect(() => {
    api.get('/stock/pickup/dealers')
      .then(r => setDealers(r.data.dealers || []))
      .catch(err => {
        console.error('Error loading dealers:', err)
        
        const errorData = err.response?.data
        const statusCode = err.response?.status
        
        let errorMessage = 'Failed to load dealers'
        
        if (statusCode === 403) {
          errorMessage = 'Access denied. Please contact your Admin.'
        } else if (statusCode === 404) {
          errorMessage = 'No dealers found in your location. Please contact your Admin.'
        } else if (statusCode === 500) {
          errorMessage = 'Server error occurred. Please try again in a moment.'
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = errorData?.message || 'Unable to load dealers. Please try again.'
        }
        
        showError(errorMessage, 'Dealers Loading Failed')
        setDealers([]) // Set empty array as fallback
      })

    refreshAllowance()
    loadPickups()
    checkConfirmedOrders()
    loadCurrentUserLocation()
    checkEligibility()
    checkAccountStatus()
    checkAdditionalPickupEligibility()
  }, [])

  // Load current user location
  function loadCurrentUserLocation() {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setCurrentUserLocation(user.location || '')
  }

  function checkEligibility() {
    api.get('/marketer/stock/pickup/eligibility')
      .then(r => {
        setEligibilityInfo(r.data)
        console.log('Eligibility check:', r.data)
      })
      .catch(err => {
        console.error('Eligibility check failed:', err)
        
        const errorData = err.response?.data
        const statusCode = err.response?.status
        
        let errorMessage = 'Failed to check eligibility'
        
        if (statusCode === 403) {
          errorMessage = 'Access denied. Please contact your Admin.'
        } else if (statusCode === 404) {
          errorMessage = 'Eligibility service not found. Please refresh and try again.'
        } else if (statusCode === 500) {
          errorMessage = 'Server error occurred. Please try again in a moment.'
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = errorData?.message || 'Unable to check eligibility. Please try again.'
        }
        
        // Show error to user
        showError(errorMessage, 'Eligibility Check Failed')
        
        // Set fallback eligibility info
        setEligibilityInfo({
          eligible: false,
          hasActiveStock: false,
          hasPendingReturn: false,
          hasPendingTransfer: false,
          hasPendingOrder: false,
          isLocked: false,
          message: 'Failed to check eligibility'
        })
      })
  }

  function checkAccountStatus() {
    // Get current user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setAccountStatus({
      blocked: user.account_blocked || false,
      violationCount: user.pickup_violation_count || 0,
      blockingReason: user.blocking_reason || null
    })
  }

  function checkAdditionalPickupEligibility() {
    api.get('/stock/pickup/eligibility')
      .then(r => {
        setAdditionalPickupEligibility(r.data)
        console.log('Additional pickup eligibility check:', r.data)
      })
      .catch(err => {
        console.error('Additional pickup eligibility check failed:', err)
        
        const errorData = err.response?.data
        const statusCode = err.response?.status
        
        let errorMessage = 'Failed to check additional pickup eligibility'
        
        if (statusCode === 403) {
          errorMessage = 'Access denied. Please contact your Admin.'
        } else if (statusCode === 404) {
          errorMessage = 'Additional pickup eligibility service not found. Please refresh and try again.'
        } else if (statusCode === 500) {
          errorMessage = 'Server error occurred. Please try again in a moment.'
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = errorData?.message || 'Unable to check additional pickup eligibility. Please try again.'
        }
        
        // Set fallback eligibility info
        setAdditionalPickupEligibility({
          eligible: false,
          hasConfirmedOrder: false,
          hasPendingCompletion: false,
          hasPendingRequest: false,
          cooldownActive: false,
          cooldownUntil: null,
          message: errorMessage
        })
      })
  }

  function getEligibilityMessage() {
    if (eligibilityInfo.isLocked) {
      return 'Your account is locked. Contact your Admin or MasterAdmin.'
    }
    if (eligibilityInfo.hasPendingReturn) {
      return 'You have a pending return. Wait for MasterAdmin confirmation before picking up new stock.'
    }
    if (eligibilityInfo.hasPendingTransfer) {
      return 'You have a pending transfer. Wait for MasterAdmin confirmation before picking up new stock.'
    }
    if (eligibilityInfo.hasPendingOrder) {
      return 'You have a pending order. Wait for MasterAdmin confirmation before picking up new stock.'
    }
    if (eligibilityInfo.hasActiveStock) {
      return 'You have active stock. Complete or return existing stock before picking up new stock.'
    }
    return 'You are eligible for stock pickup'
  }

  function getAdditionalPickupEligibilityMessage() {
    if (additionalPickupEligibility.cooldownActive && additionalPickupEligibility.cooldownUntil) {
      const cooldownMs = new Date(additionalPickupEligibility.cooldownUntil).getTime() - now
      if (cooldownMs > 0) {
        const hours = Math.floor(cooldownMs / 3600000)
        const minutes = Math.floor((cooldownMs % 3600000) / 60000)
        return `You must wait ${hours}h ${minutes}m before requesting additional pickup again`
      }
    }
    
    if (!additionalPickupEligibility.hasConfirmedOrder) {
      return 'You must have at least one confirmed order to request additional pickup'
    }
    
    if (additionalPickupEligibility.hasPendingCompletion) {
      return 'You must complete your current additional pickup before requesting another'
    }
    
    if (additionalPickupEligibility.hasPendingRequest) {
      return 'You already have a pending additional pickup request'
    }
    
    return additionalPickupEligibility.message || 'You are eligible for additional pickup request'
  }

  // Track pickup completion (returned/transferred)
  async function trackPickupCompletion(pickupId, completionType, notes = '') {
    try {
      const response = await api.post('/stock/pickup/completion', {
        pickupId,
        completionType,
        notes
      })
      
      if (response.data.success) {
        showSuccess(
          `Pickup marked as ${completionType} successfully`,
          'Completion Tracked'
        )
        loadPickups() // Refresh the pickups list
        checkEligibility() // Refresh eligibility status
        checkAdditionalPickupEligibility() // Refresh additional pickup eligibility
      }
    } catch (error) {
      console.error('Error tracking completion:', error)
      showError(
        error.response?.data?.message || 'Failed to track completion',
        'Error'
      )
    }
  }

  function refreshAllowance() {
    api.get('/stock/pickup/allowance')
      .then(r => {
        const {
          allowance,
          request_status,
          next_request_allowed_at
        } = r.data

        setAllowanceInfo({
          allowance,
          request_status,
          next_request_at: next_request_allowed_at
        })
      })
      .catch(console.error)
  }

  function loadPickups() {
    api.get('/stock/marketer')
      .then(r => setPickups(r.data.data || []))
      .catch(console.error)
  }

  function checkConfirmedOrders() {
    api.get('/marketer/orders/history')
      .then(r => {
        const confirmedOrders = r.data.data?.filter(order => 
          order.status === 'confirmed' && order.stock_update_id
        ) || []
        setHasConfirmedOrders(confirmedOrders.length > 0)
      })
      .catch(console.error)
  }

  // Auto-expand lines and alert once, but skip on the very first mount
  useEffect(() => {
    const prev = prevStatusRef.current
    const curr = allowanceInfo.request_status

    // only when we go from 'pending' → 'approved'
    if (prev === 'pending' && curr === 'approved') {
      // auto-expand to exactly allowance rows
      setLines(lines =>
        lines.length >= allowanceInfo.allowance
          ? lines
          : Array.from(
              { length: allowanceInfo.allowance },
              () => ({ product_id: '' })
            )
      )

      // show alert exactly on that transition
      showSuccess(
        `Your request for additional pickup has been approved! You can now pick up up to ${allowanceInfo.allowance} items.`,
        'Request Approved!'
      )
    }

    // update prevStatus for next time
    prevStatusRef.current = curr
   }, [allowanceInfo.request_status, allowanceInfo.allowance])

  // Dealer → load products & reset lines
  function handleDealerChange(e) {
    const uid = e.target.value
    setSelectedDealer(uid)
    setProducts([])
    setLines([{ product_id: '' }])
    if (!uid) return

    api.get(`/stock/pickup/dealers/${uid}/products`)
      .then(r => setProducts(r.data.products || []))
      .catch(console.error)
  }

  // Add another line
  function addLine() {
    if (lines.length < allowanceInfo.allowance) {
      setLines([...lines, { product_id: '' }])
    }
  }

  // Update product selection
  function updateLine(idx, val) {
    const updated = [...lines]
    updated[idx] = { product_id: val }
    setLines(updated)
  }

  // Submit all pickups (qty = 1 each)
  async function handleSubmit(e) {
    e.preventDefault()
    
    // Check if account is blocked
    if (accountStatus.blocked) {
      return showError(
        `Your account is blocked due to pickup violations. ${accountStatus.blockingReason || 'Please contact MasterAdmin to unlock your account.'}`,
        'Account Blocked'
      )
    }
    
    if (!selectedDealer) {
      return showError('Please select a dealer.', 'Validation Error')
    }
    // ensure every line has a product
    for (const { product_id } of lines) {
      if (!product_id) {
        return showError('Please choose a product on every line.', 'Validation Error')
      }
    }
    try {
      await Promise.all(lines.map(({ product_id }) =>
        api.post('/stock', {
          dealer_unique_id: selectedDealer,
          product_id,
          quantity: 1
        })
      ))
      showSuccess('Pickup recorded successfully!')
      // reset form
      setSelectedDealer('')
      setProducts([])
      setLines([{ product_id: '' }])
      refreshAllowance()
      loadPickups()
      checkAccountStatus() // Refresh account status
    } catch (err) {
      console.error('Pickup submission error:', err)
      
      // Handle violation responses
      if (err.response?.data?.violationCount) {
        const violationData = err.response.data
        if (violationData.accountBlocked) {
          showError(
            `ACCOUNT BLOCKED: ${violationData.message}`,
            'Account Blocked'
          )
          // Update local account status
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          user.account_blocked = true
          user.pickup_violation_count = violationData.violationCount
          user.blocking_reason = violationData.message
          localStorage.setItem('user', JSON.stringify(user))
          checkAccountStatus()
        } else {
          showWarning(
            `WARNING: ${violationData.message}`,
            `Violation ${violationData.violationCount}/3`
          )
          // Update local violation count
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          user.pickup_violation_count = violationData.violationCount
          localStorage.setItem('user', JSON.stringify(user))
          checkAccountStatus()
        }
      } else {
        // Enhanced error handling with specific messages
        const errorData = err.response?.data
        const errorCode = errorData?.errorCode
        const statusCode = err.response?.status
        
        let errorMessage = 'Error recording pickup'
        let errorTitle = 'Pickup Failed'
        let showRetry = false
        
        // Handle specific error codes
        if (errorCode === 'DUPLICATE_PICKUP') {
          errorMessage = 'This pickup already exists. Please refresh the page and try again.'
          errorTitle = 'Duplicate Pickup'
          showRetry = true
        } else if (errorCode === 'INVALID_REFERENCE') {
          errorMessage = 'Invalid product or dealer selected. Please refresh and select again.'
          errorTitle = 'Invalid Selection'
          showRetry = true
        } else if (errorCode === 'INVALID_DATA') {
          errorMessage = 'Invalid data provided. Please check your selections and try again.'
          errorTitle = 'Invalid Data'
        } else if (errorCode === 'DATABASE_ERROR') {
          errorMessage = 'Database connection failed. Please try again in a moment.'
          errorTitle = 'Connection Error'
          showRetry = true
        } else if (errorCode === 'TIMEOUT') {
          errorMessage = 'Request timed out. Please check your connection and try again.'
          errorTitle = 'Timeout Error'
          showRetry = true
        } else if (errorCode === 'PERMISSION_DENIED') {
          errorMessage = 'You do not have permission to perform this action. Please contact your Admin.'
          errorTitle = 'Permission Denied'
        } else if (statusCode === 400) {
          errorMessage = errorData?.message || 'Invalid request. Please check your selections.'
          errorTitle = 'Invalid Request'
        } else if (statusCode === 403) {
          errorMessage = errorData?.message || 'Access denied. Please contact your Admin.'
          errorTitle = 'Access Denied'
        } else if (statusCode === 404) {
          errorMessage = 'Resource not found. Please refresh and try again.'
          errorTitle = 'Not Found'
          showRetry = true
        } else if (statusCode === 409) {
          errorMessage = 'Conflict detected. Please refresh and try again.'
          errorTitle = 'Conflict'
          showRetry = true
        } else if (statusCode === 500) {
          errorMessage = 'Server error occurred. Please try again in a moment.'
          errorTitle = 'Server Error'
          showRetry = true
        } else if (statusCode === 503) {
          errorMessage = 'Service temporarily unavailable. Please try again later.'
          errorTitle = 'Service Unavailable'
          showRetry = true
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
          errorTitle = 'Network Error'
          showRetry = true
        } else {
          errorMessage = errorData?.message || 'An unexpected error occurred. Please try again.'
          errorTitle = 'Unexpected Error'
          showRetry = true
        }
        
        // Show error with retry option if applicable
        if (showRetry) {
          showError(
            `${errorMessage}\n\nClick "Retry" to try again.`,
            errorTitle,
            () => {
              // Retry function
              handleSubmit(e)
            }
          )
        } else {
          showError(errorMessage, errorTitle)
        }
      }
    }
  }

  // Ask for extra pickup
  async function onRequestAdditional() {
    try {
      await api.post('/stock/pickup/request-additional');
      showInfo('Additional pickup requested—waiting for approval.', 'Request Submitted');
      refreshAllowance();
      checkEligibility();
      checkAdditionalPickupEligibility(); // Refresh eligibility status
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Request failed', 'Request Failed');
    }
  }

  // Transfer & return handlers
  async function submitTransfer() {
    if (!transferTarget.trim()) return showError('Enter a target ID.', 'Validation Error')
    try {
      await api.post(`/stock/${transferringId}/transfer`, {
        targetIdentifier: transferTarget.trim()
      })
      showSuccess('Transfer requested successfully!')
      setTransferringId(null)
      setTransferTarget('')
      loadPickups()
    } catch (err) {
      console.error(err)
      showError(err.response?.data?.message || 'Transfer failed', 'Transfer Failed')
    }
  }

  // New transfer popover handlers
  function handleTransferClick(stockId) {
    setCurrentStockId(stockId)
    setShowTransferPopover(true)
  }

  function handleTransferSuccess() {
    // Mark the pickup as transferred using the new completion tracking
    if (currentStockId) {
      trackPickupCompletion(currentStockId, 'transferred')
    }
    setShowTransferPopover(false)
    setCurrentStockId(null)
  }

  function handleTransferClose() {
    setShowTransferPopover(false)
    setCurrentStockId(null)
  }
  async function submitReturn(id) {
    try {
      // Request return - requires MasterAdmin confirmation
      await api.patch(`/stock/${id}/return-request`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      showSuccess('Return requested successfully! Awaiting MasterAdmin confirmation.', 'Return Requested')
      loadPickups() // Refresh the pickups list
    } catch (err) {
      console.error(err)
      showError(err.response?.data?.message || 'Return request failed', 'Return Request Failed')
    }
  }

  // Enhanced countdown helper with count-up functionality
  function formatRemaining(ms, status) {
    const isOverdue = ms < 0
    const absMs = Math.abs(ms)
    const hrs  = Math.floor(absMs / 3600000)
    const mins = Math.floor((absMs % 3600000) / 60000)
    const secs = Math.floor((absMs % 60000) / 1000)
    
    if (isOverdue) {
      // Red countup for overdue items
      return {
        text: `+${hrs}h ${mins}m ${secs}s`,
        className: 'text-red-600 font-bold',
        status: 'overdue'
      }
    } else {
      // Green countdown for items within deadline
      return {
        text: `${hrs}h ${mins}m ${secs}s`,
        className: 'text-green-600',
        status: status === 'pending_order' ? 'pending_order' : 'pending'
      }
    }
  }

  const { allowance, request_status, next_request_at } = allowanceInfo
  const canAddMore = request_status === 'approved' && lines.length < allowance
  const canRequestAdditional = allowance === 1 && request_status === null && additionalPickupEligibility.eligible
  const rejectedCd = request_status === 'rejected' && next_request_at
    ? formatRemaining(new Date(next_request_at).getTime() - now).text
    : null

  return (
    <div className="px-4 py-6 md:px-6 lg:px-12 space-y-8">
      <h1 className="text-2xl font-bold text-center">Stock Pickup</h1>
      
      {/* Account Status Warning */}
      {accountStatus.blocked && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Account Blocked
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{accountStatus.blockingReason || 'Your account has been blocked due to pickup violations.'}</p>
                <p className="mt-1">Violations: {accountStatus.violationCount}/3</p>
                <p className="mt-1">Please contact MasterAdmin to unlock your account.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Violation Warning (not blocked yet) */}
      {!accountStatus.blocked && accountStatus.violationCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Violation Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You have {accountStatus.violationCount} violation(s). Please complete or return all active stock before picking up new stock.</p>
                <p className="mt-1">After 3 violations, your account will be blocked.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        open={alert.open}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        showCancel={alert.showCancel}
        variant={alert.variant}
      />

      <form onSubmit={handleSubmit} className={`bg-white p-4 sm:p-6 rounded-lg shadow space-y-4 sm:space-y-6 ${accountStatus.blocked || !eligibilityInfo.eligible ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Dealer selector */}
        <div>
          <label className="block mb-2 font-medium text-sm sm:text-base">Dealer</label>
          <select
            value={selectedDealer}
            onChange={handleDealerChange}
            className="w-full border border-gray-300 p-3 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">— choose dealer —</option>
            {dealers.map(d => (
              <option key={d.unique_id} value={d.unique_id}>
                {d.business_name} ({d.location})
              </option>
            ))}
          </select>
        </div>

        {/* Product lines (qty fixed at 1) */}
        {lines.map((ln, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium text-sm sm:text-base">Product #{i+1}</label>
              <select
                value={ln.product_id}
                onChange={e => updateLine(i, e.target.value)}
                disabled={!selectedDealer}
                className="w-full border border-gray-300 p-3 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">— choose product —</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.device_name} {p.device_model} — {p.qty_available} avail. — {formatCurrency(p.selling_price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium text-sm sm:text-base">Quantity</label>
              <input
                type="number"
                value={1}
                readOnly
                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-100 cursor-not-allowed text-sm sm:text-base"
              />
            </div>
          </div>
        ))}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {canAddMore && (
            <button
              type="button"
              onClick={addLine}
              className="text-black hover:underline text-sm sm:text-base font-medium border border-[#f59e0b] px-3 py-1 rounded-lg hover:bg-[#f59e0b] hover:text-white transition-colors"
            >
              + Add another product
            </button>
          )}
          {allowance === 1 && request_status === null && (
            <button
              type="button"
              onClick={onRequestAdditional}
              disabled={!additionalPickupEligibility.eligible}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors border-2 ${
                additionalPickupEligibility.eligible 
                  ? 'bg-white text-black hover:bg-[#f59e0b] hover:text-white border-[#f59e0b]' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
              }`}
              title={!additionalPickupEligibility.eligible ? getAdditionalPickupEligibilityMessage() : ''}
            >
              Request Additional Pickup
            </button>
          )}
        </div>

        {/* Status messages */}
        {request_status === 'pending' && (
          <p className="text-blue-700">Waiting for Master Admin approval…</p>
        )}
        {request_status === 'rejected' && rejectedCd && (
          <p className="text-red-700">
            Your request was rejected. Try again in {rejectedCd}.
          </p>
        )}
        {!eligibilityInfo.eligible && (
          <div className={`p-3 rounded-lg text-sm ${
            eligibilityInfo.isLocked 
              ? 'bg-red-50 border border-red-200 text-red-700'
              : eligibilityInfo.hasPendingReturn || eligibilityInfo.hasPendingTransfer
              ? 'bg-orange-50 border border-orange-200 text-orange-700'
              : 'bg-amber-50 border border-amber-200 text-amber-700'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {eligibilityInfo.isLocked ? (
                  <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ) : eligibilityInfo.hasPendingReturn || eligibilityInfo.hasPendingTransfer ? (
                  <svg className="h-4 w-4 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-2">
                <p className="font-medium">{getAdditionalPickupEligibilityMessage()}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!eligibilityInfo.eligible || accountStatus.blocked}
          className={`w-full py-3 px-4 rounded-lg text-sm sm:text-base font-medium transition-colors focus:ring-2 focus:ring-offset-2 border-2 ${
            eligibilityInfo.eligible && !accountStatus.blocked
              ? 'bg-white text-black hover:bg-[#f59e0b] hover:text-white border-[#f59e0b] focus:ring-[#f59e0b]'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
          }`}
          title={!eligibilityInfo.eligible ? getEligibilityMessage() : ''}
        >
          {!eligibilityInfo.eligible ? 'Cannot Pick Up' : 'Pick up'}
        </button>
      </form>

      {/* ── My Stock Pickups ────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Stock Pickups</h2>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {pickups.length === 0
            ? <p className="text-gray-500 text-center py-8">No pickups yet.</p>
            : pickups.map(s => {
                const diff      = new Date(s.deadline).getTime() - now
                const remaining = s.status === 'pending'
                  ? formatRemaining(diff, s.status)
                  : s.status === 'pending_order'
                    ? formatRemaining(diff, s.status)   // Continue countdown during pending order
                  : s.status === 'expired'
                    ? formatRemaining(-diff, s.status)  // Always count-up (red)
                  : s.status === 'return_pending' || s.status === 'transfer_pending'
                    ? formatRemaining(diff, s.status)   // Countdown if before deadline, count-up if after
                  : s.status === 'sold'
                    ? { text: 'Sold', className: 'text-green-600 font-semibold', status: 'sold' }
                    : { text: '—', className: 'text-gray-500', status: 'completed' }
                return (
                  <div key={s.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                        {s.device_name} {s.device_model}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Picked: {new Date(s.pickup_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        s.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className="text-sm font-medium">{s.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Value</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(s.total_value)}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 mb-1">Time Remaining</p>
                      <p className={`text-sm font-medium ${remaining.className}`}>
                        {remaining.text}
                      </p>
                    </div>
                    {s.status === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleTransferClick(s.id)}
                          className="flex-1 bg-white text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md border-2 border-[#f59e0b]"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Transfer
                        </button>
                        <button
                          onClick={() => submitReturn(s.id)}
                          className="flex-1 bg-white text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md border-2 border-[#f59e0b]"
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5" />
                          </svg>
                          Return
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
          }
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-[1200px] w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase">
              <tr>
                {['Device','Qty','Value','Picked','Deadline','Remaining','Status','Actions']
                  .map(h => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))
                }
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pickups.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">
                      No pickups yet.
                    </td>
                  </tr>
                )
                : pickups.map(s => {
                    const diff      = new Date(s.deadline).getTime() - now
                    const remaining = s.status === 'pending'
                      ? formatRemaining(diff, s.status)
                      : s.status === 'pending_order'
                        ? formatRemaining(diff, s.status)   // Continue countdown during pending order
                      : s.status === 'expired'
                        ? formatRemaining(-diff, s.status)  // Always count-up (red)
                      : s.status === 'return_pending' || s.status === 'transfer_pending'
                        ? formatRemaining(diff, s.status)   // Countdown if before deadline, count-up if after
                      : s.status === 'sold'
                        ? { text: 'Sold', className: 'text-green-600 font-semibold', status: 'sold' }
                        : { text: '—', className: 'text-gray-500', status: 'completed' }
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {s.device_name} {s.device_model}
                        </td>
                        <td className="px-4 py-2">{s.quantity}</td>
                        <td className="px-4 py-2 font-medium text-green-600">
                          {formatCurrency(s.total_value)}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(s.pickup_date).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(s.deadline).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <span className={remaining.className}>{remaining.text}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            s.status === 'return_pending' ? 'bg-orange-100 text-orange-800' :
                            s.status === 'expired' ? 'bg-red-100 text-red-800' :
                            s.status === 'sold' ? 'bg-green-100 text-green-800' :
                            s.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                            s.status === 'transferred' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {s.status === 'return_pending' ? 'Pending Return' : s.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {s.status === 'pending' && (
                            <div className="flex items-center space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => handleTransferClick(s.id)}
                                className="inline-flex items-center px-2 py-1.5 bg-white text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md border-2 border-[#f59e0b]"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                Transfer
                              </button>
                              <button
                                onClick={() => submitReturn(s.id)}
                                className="inline-flex items-center px-2 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md border-2 border-[#f59e0b]"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5" />
                                </svg>
                                Return
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        open={alert.open}
        onOpenChange={hideAlert}
        title={alert.title}
        description={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        showCancel={alert.showCancel}
        variant={alert.variant}
      />

      {/* Transfer Popover */}
      <TransferPopover
        isOpen={showTransferPopover}
        onClose={handleTransferClose}
        stockId={currentStockId}
        onTransferSuccess={handleTransferSuccess}
        currentUserLocation={currentUserLocation}
      />
    </div>
  )
}
