/**
 * AI Extension DOM Detector - Comprehensive Scan
 * Hides ALL elements in body without protect attribute AND elements between <html>-<head> AND elements between </body>-</html>
 */

(function() {
    'use strict';
    
    // Configuration for protection
    var PROTECT_ATTRIBUTE = 'hireproElement'; // Custom attribute for protection
    
    // Minimal state for aggressive scan
    var hiddenElements = [];
    var detectionCount = 0;

    /**
     * Log messages to console and UI if available
     */
    function log(message, type) {
        var timestamp = new Date().toLocaleTimeString();
        var logMessage = '[' + timestamp + '] AI Detector: ' + message;
        if (type === 'error') {
            console.error(logMessage);
        } else if (type === 'warn') {
            console.warn(logMessage);
        } else {
            console.log(logMessage);
        }
        if (typeof window.addLogEntry === 'function') {
            window.addLogEntry(message, type);
        }
    }

    /**
     * Check if an element or its parent has the protect attribute
     */
    function hasProtectAttribute(element) {
        if (!element) return false;
        
        // Check the element itself
        if (element.hasAttribute && element.hasAttribute(PROTECT_ATTRIBUTE)) {
            return true;
        }
        
        // Check all parent elements up to the document root
        var currentElement = element;
        while (currentElement && currentElement !== document.documentElement) {
            if (currentElement.hasAttribute && currentElement.hasAttribute(PROTECT_ATTRIBUTE)) {
                return true;
            }
            currentElement = currentElement.parentElement;
        }
        
        return false;
    }

    /**
     * Check if an element is between <html> and <head> tags
     */
    function isBetweenHtmlAndHead(element) {
        if (!element || !element.parentNode) return false;
        
        // Check if the element is a direct child of document.documentElement (html)
        if (element.parentNode === document.documentElement) {
            var headElement = document.head;
            if (headElement) {
                // Check if this element comes before the head tag
                var currentNode = document.documentElement.firstChild;
                while (currentNode && currentNode !== headElement) {
                    if (currentNode === element && currentNode.nodeType === 1) {
                        return true;
                    }
                    currentNode = currentNode.nextSibling;
                }
            }
        }
        return false;
    }

    /**
     * Check if an element is between </body> and </html> tags
     */
    function isBetweenBodyAndHtml(element) {
        if (!element || !element.parentNode) return false;
        
        // Check if the element is a direct child of document.documentElement (html)
        if (element.parentNode === document.documentElement) {
            var bodyElement = document.body;
            if (bodyElement) {
                // Check if this element comes after the body tag
                var currentNode = bodyElement.nextSibling;
                while (currentNode) {
                    if (currentNode === element) {
                        return true;
                    }
                    currentNode = currentNode.nextSibling;
                }
            }
        }
        return false;
    }

    /**
     * Check if an element is inside the body without protect attribute
     */
    function isElementInBodyWithoutProtection(element) {
        if (!element || element.nodeType !== 1) return false;
        
        // Don't touch our own UI elements (safety check)
        if (element.id === 'manual-scan-button' || element.id === 'log') return false;
        
        // Must be inside the body (not between body and html)
        var bodyElement = document.body;
        if (!bodyElement || !bodyElement.contains(element)) return false;
        
        // Don't hide if it has protect attribute
        if (hasProtectAttribute(element)) return false;
        
        return true;
    }

    /**
     * Check if an element should be hidden (elements in body without protect attribute OR elements between <html>-<head> OR elements between </body>-</html>)
     */
    function shouldHideElement(element) {
        if (!element || element.nodeType !== 1) return false;
        
        // Don't touch elements that are already marked as hidden
        if (element.hasAttribute('data-ai-hidden')) return false;
        
        // Don't hide elements with protect attribute (this is checked again in specific functions but kept for safety)
        if (hasProtectAttribute(element)) return false;
        
        // Hide if it's ANY element inside body without protection OR if it's between <html>-<head> OR if it's between </body>-</html>
        return isElementInBodyWithoutProtection(element) || isBetweenHtmlAndHead(element) || isBetweenBodyAndHtml(element);
    }

    /**
     * Hide an element by overwriting its styles
     */
    function hideElement(element) {
        if (!element || element.hasAttribute('data-ai-hidden')) return;
        
        try {
            var elementInfo = {
                tagName: element.tagName,
                id: element.id || 'no-id',
                className: element.className || 'no-class',
                innerHTML: element.innerHTML.substring(0, 50) + (element.innerHTML.length > 50 ? '...' : '')
            };
            
            // Apply invisibility styles with !important to override existing styles
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('pointer-events', 'none', 'important');
            element.style.setProperty('position', 'absolute', 'important');
            element.style.setProperty('left', '-9999px', 'important');
            element.style.setProperty('top', '-9999px', 'important');
            element.style.setProperty('z-index', '-9999', 'important');
            element.style.setProperty('width', '0', 'important');
            element.style.setProperty('height', '0', 'important');
            element.style.setProperty('overflow', 'hidden', 'important');
            element.setAttribute('data-ai-hidden', 'true');
            
            hiddenElements.push({
                element: element,
                timestamp: new Date(),
                info: elementInfo
            });
            
            var logMessage = 'Hidden element: ' + elementInfo.tagName + 
                           ' (id: ' + elementInfo.id + ', class: ' + elementInfo.className + ')';
            log(logMessage, 'hidden');
            detectionCount++;
        } catch (error) {
            log('Error hiding element: ' + error.message, 'error');
        }
    }

    /**
     * Scan for ALL elements in body without protect attribute AND elements between <html>-<head> AND elements between </body>-</html>
     */
    function aggressiveManualScan() {
        log('Scan initiated - targeting ALL elements in body without protect attribute AND elements between <html>-<head> AND elements between </body>-</html>');
        
        var bodyElement = document.body;
        var headElement = document.head;
        if (!bodyElement) {
            log('Body element not found', 'error');
            return;
        }
        if (!headElement) {
            log('Head element not found', 'error');
            return;
        }
        
        var elementsToHide = [];
        var protectedElementsInBody = 0;
        var protectedElementsBeforeHead = 0;
        var protectedElementsAfterBody = 0;
        var elementsHiddenInBody = 0;
        var elementsHiddenBeforeHead = 0;
        var elementsHiddenAfterBody = 0;
        
        // 1. Scan ALL elements inside the body
        var allElementsInBody = bodyElement.getElementsByTagName('*');
        for (var i = 0; i < allElementsInBody.length; i++) {
            var element = allElementsInBody[i];
            if (isElementInBodyWithoutProtection(element)) {
                elementsToHide.push(element);
                elementsHiddenInBody++;
            } else if (hasProtectAttribute(element)) {
                protectedElementsInBody++;
            }
        }
        
        // 2. Scan all direct children of html element
        var htmlChildren = document.documentElement.children;
        for (var j = 0; j < htmlChildren.length; j++) {
            var child = htmlChildren[j];
            
            // Check for elements between <html> and <head>
            if (isBetweenHtmlAndHead(child)) {
                if (shouldHideElement(child)) {
                    elementsToHide.push(child);
                    elementsHiddenBeforeHead++;
                } else if (hasProtectAttribute(child)) {
                    protectedElementsBeforeHead++;
                }
            }
            
            // Check for elements between </body> and </html>
            if (isBetweenBodyAndHtml(child)) {
                if (shouldHideElement(child)) {
                    elementsToHide.push(child);
                    elementsHiddenAfterBody++;
                } else if (hasProtectAttribute(child)) {
                    protectedElementsAfterBody++;
                }
            }
        }
        
        // 3. Scan siblings before head tag
        var currentNode = document.documentElement.firstChild;
        while (currentNode && currentNode !== headElement) {
            if (currentNode.nodeType === 1 && isBetweenHtmlAndHead(currentNode)) {
                if (shouldHideElement(currentNode)) {
                    elementsToHide.push(currentNode);
                    elementsHiddenBeforeHead++;
                } else if (hasProtectAttribute(currentNode)) {
                    protectedElementsBeforeHead++;
                }
            }
            currentNode = currentNode.nextSibling;
        }
        
        // 4. Scan siblings after body tag
        currentNode = bodyElement.nextSibling;
        while (currentNode) {
            if (currentNode.nodeType === 1 && isBetweenBodyAndHtml(currentNode)) {
                if (shouldHideElement(currentNode)) {
                    elementsToHide.push(currentNode);
                    elementsHiddenAfterBody++;
                } else if (hasProtectAttribute(currentNode)) {
                    protectedElementsAfterBody++;
                }
            }
            currentNode = currentNode.nextSibling;
        }
        
        // Hide all identified elements
        for (var k = 0; k < elementsToHide.length; k++) {
            hideElement(elementsToHide[k]);
        }
        
        var totalHidden = elementsHiddenInBody + elementsHiddenBeforeHead + elementsHiddenAfterBody;
        var totalProtected = protectedElementsInBody + protectedElementsBeforeHead + protectedElementsAfterBody;
        
        log('Scan completed:');
        log('- Elements hidden in body: ' + elementsHiddenInBody);
        log('- Elements hidden before head: ' + elementsHiddenBeforeHead);
        log('- Elements hidden after body: ' + elementsHiddenAfterBody);
        log('- Total elements hidden: ' + totalHidden);
        log('- Elements protected in body: ' + protectedElementsInBody);
        log('- Elements protected before head: ' + protectedElementsBeforeHead);
        log('- Elements protected after body: ' + protectedElementsAfterBody);
        log('- Total elements protected: ' + totalProtected);
        
        log('Protect attribute: "' + PROTECT_ATTRIBUTE + '"');
    }

    // Expose the scan function
    window.AIExtensionDetector = {
        aggressiveManualScan: aggressiveManualScan,
        setProtectAttribute: function(attributeName) {
            PROTECT_ATTRIBUTE = attributeName;
            log('Protect attribute updated to: "' + attributeName + '"');
        },
        getProtectAttribute: function() {
            return PROTECT_ATTRIBUTE;
        }
    };

})(); 