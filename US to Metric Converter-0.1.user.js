// ==UserScript==
// @name         US to Metric Converter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Converts US units to metric units on web pages.
// @author       Cline
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const usUnitsRegex = /(\d+(?:\.\d+)?)\s*(inches|in|"|feet|ft|yards|yd|miles|mi|pounds|lbs|ounces|oz|fahrenheit|°F)/gi;

    // 扩展度量词关键字
    const measurementKeywords = [
        'size', 'sized', 'dimension', 'dimensions', 'width', 'height', 'length',
        'weight', 'mass', 'cube', 'volume', 'diameter', 'radius', 'depth',
        'thick', 'thickness', 'distance', 'measurement', 'measurements'
    ];

    const contextRegex = new RegExp(`\\b(${measurementKeywords.join('|')})\\b`, 'i');

    function getVisibleContext(node, charCount) {
        let context = '';
        let prevNode = node.previousSibling;
        let nextNode = node.nextSibling;

        // 获取前面的可见文本
        while (prevNode && context.length < charCount) {
            if (prevNode.nodeType === Node.TEXT_NODE && prevNode.nodeValue.trim()) {
                context = prevNode.nodeValue.trim() + ' ' + context;
            }
            prevNode = prevNode.previousSibling;
        }

        // 获取当前节点文本
        if (node.nodeType === Node.TEXT_NODE) {
            context += node.nodeValue.trim();
        }

        // 获取后面的可见文本
        while (nextNode && context.length < charCount * 2) {
            if (nextNode.nodeType === Node.TEXT_NODE && nextNode.nodeValue.trim()) {
                context += ' ' + nextNode.nodeValue.trim();
            }
            nextNode = nextNode.nextSibling;
        }

        return context;
    }

    function convertUnits(match, value, unit, offset, string) {
        // 获取当前文本节点的可见上下文
        const visibleContext = getVisibleContext(this.currentNode, 50);
        console.log('Visible context:', visibleContext);

        if (!contextRegex.test(visibleContext)) {
            return match;
        }

        let convertedValue;
        let convertedUnit;

        switch (unit.toLowerCase()) {
            case 'inches':
            case 'in':
            case '"':
            case "''":
                convertedValue = value * 2.54;
                convertedUnit = 'cm';
                break;
            case 'feet':
            case 'ft':
                convertedValue = value * 0.3048;
                convertedUnit = 'm';
                break;
            case 'yards':
            case 'yd':
                convertedValue = value * 0.9144;
                convertedUnit = 'm';
                break;
            case 'miles':
            case 'mi':
                convertedValue = value * 1.60934;
                convertedUnit = 'km';
                break;
            case 'pounds':
            case 'lbs':
                convertedValue = value * 0.453592;
                convertedUnit = 'kg';
                break;
            case 'ounces':
            case 'oz':
                convertedValue = value * 28.3495;
                convertedUnit = 'g';
                break;
            case 'fahrenheit':
            case '°f':
                convertedValue = (value - 32) * 5/9;
                convertedUnit = '°C';
                break;
        }

        return `${convertedValue.toFixed(2)} ${convertedUnit}`;
    }

    function replaceUsUnits(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
            // 将当前节点传递给convertUnits函数
            const boundConvertUnits = convertUnits.bind({ currentNode: node });
            node.nodeValue = node.nodeValue.replace(usUnitsRegex, boundConvertUnits);
        } else {
            for (const child of node.childNodes) {
                replaceUsUnits(child);
            }
        }
    }

    replaceUsUnits(document.body);

    // Observe changes to the DOM and update units dynamically
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    replaceUsUnits(node);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
