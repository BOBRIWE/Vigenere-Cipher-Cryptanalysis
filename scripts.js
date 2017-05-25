(function() {
    "use strict";


    var alphabets = {
        "RU": "абвгдежзийклмнопрстуфхцчшщыьъэюя",
        "EN": "abcdefghijklmnopqrstuvwxyz"
    };
    var htmlID = document.getElementsByTagName("html")[0];
    var decryptedAreaID = document.getElementById("decrypted");
    var encryptedAreaID = document.getElementById("encrypted");
    var sourceID = document.getElementsByClassName("source")[0];
    var outputID = document.getElementsByClassName("output")[0];
    var languageID = document.getElementById("language");
    var keyID = document.getElementById("key");
    var cryptanalysisMethod = document.getElementById("cryptanalysis-method");
    var MAXKEYLN = 502;
    var processID = document.getElementById("process");
    var launchMainClasses = document.getElementsByClassName("launch-main");
    var lettersFreq = {
        "RU": {
            "а": 0.07998,
            "б": 0.01592,
            "в": 0.04533,
            "г": 0.01687,
            "д": 0.02977,
            "е": 0.08483,
            "ж": 0.0094,
            "з": 0.01641,
            "и": 0.07367,
            "й": 0.01208,
            "к": 0.03486,
            "л": 0.04343,
            "м": 0.03203,
            "н": 0.067,
            "о": 0.10983,
            "п": 0.02804,
            "р": 0.04746,
            "с": 0.05473,
            "т": 0.06318,
            "у": 0.02615,
            "ф": 0.00267,
            "х": 0.00966,
            "ц": 0.00486,
            "ч": 0.0145,
            "ш": 0.00718,
            "щ": 0.00361,
            "ы": 0.01898,
            "ь": 0.01735,
            "ъ": 0.00037,
            "э": 0.00331,
            "ю": 0.00639,
            "я": 0.02001,
            "ё": 0.00013
        },
        "EN": {
            "a": 0.08167,
            "b": 0.01492,
            "c": 0.02782,
            "d": 0.04253,
            "e": 0.12702,
            "f": 0.02228,
            "g": 0.02015,
            "h": 0.06094,
            "i": 0.06966,
            "j": 0.00153,
            "k": 0.00772,
            "l": 0.04025,
            "m": 0.02406,
            "n": 0.06749,
            "o": 0.07507,
            "p": 0.01929,
            "q": 0.00095,
            "r": 0.05987,
            "s": 0.06327,
            "t": 0.09056,
            "u": 0.02758,
            "v": 0.00978,
            "w": 0.02360,
            "x": 0.00150,
            "y": 0.01974,
            "z": 0.00074
        }
    };


    autoSize(keyID);
    decryptedAreaID.focus();

    /*if(!document.createEvent) {
        var inputEvent = new KeyboardEvent("input");
    } else {*/
        var inputEvent = document.createEvent("KeyboardEvent");
        inputEvent.initEvent("input", true, false);
    //}


    window.onresize = function() {
        textAreaAdjust(decryptedAreaID);
        textAreaAdjust(encryptedAreaID);
    };

    document.getElementById("key-found").addEventListener("click", function() {
        document.getElementById("step-by-step").className += " hidden";
        document.getElementById("step2").className += " hidden";

        keyID.value = document.getElementById("possible-key").value;

        processID.value = "DECODE";
        sourceID.dispatchEvent(inputEvent);
    }, false);

    document.getElementById("key-change").addEventListener("click", function() {
        var text = sourceID.value;
        var keyWord = getClearText(languageID.value,
            document.getElementById("possible-key").value.trim());

        if(!keyWord) {
            return;
        }

        document.getElementById("possible-text").value =
            getDecodedVigenereText(languageID.value, text.substr(0, 200), keyWord)
            + "...";
    }, false);

    document.getElementById("cryptanalysis").addEventListener("click", function() {

        if(cryptanalysisMethod.value === "SBS") {
            cryptanalysisStep1();
        } else {
            var VC = new VigenereCryptanalysis(languageID.value, decryptedAreaID.value);
            keyID.value = VC.getKeyWord(VC.getKeyLength(VC.getICs()));


            processID.value = "DECODE";
            sourceID.dispatchEvent(inputEvent);
            alert("Key is: " + keyID.value);
        }

    }, false);

    document.getElementById("start-step2").addEventListener("click", function() {
        document.getElementById("step2").classList.remove("hidden");
        cryptanalysisStep2();

    }, false);

    var closeBtns = document.getElementsByClassName("close-btn");
    for(var i = 0; i < closeBtns.length; i++) {
        closeBtns[i].addEventListener("click", function() {
            this.parentElement.classList += " hidden";
        }, false);
    }

    /*document.getElementById("decode").addEventListener("click", function() {
     switchArea(decryptedAreaID, encryptedAreaID);
     process = "DECODE";
     }, false);

     document.getElementById("encode").addEventListener("click", function() {
     switchArea(encryptedAreaID, decryptedAreaID);
     process = "ENCODE";
     }, false);*/

    var Delay = 1500;

    var delayedFnDecrypted = makeDelayedFn(function() {
        encryptedAreaID.value += "...";
        main(processID.value);
    }, Delay);

    var delayedFnEncrypted = makeDelayedFn(function() {
        decryptedAreaID.value += "...";
        main(processID.value);
    }, Delay);

    var delayedFnKey = makeDelayedFn(function() {
        main(processID.value);
    }, Delay);

    decryptedAreaID.addEventListener("input", function() {
        textAreaAdjust(this);
        delayedFnDecrypted();
    }, false);

    encryptedAreaID.addEventListener("input", function() {
        textAreaAdjust(this);
        delayedFnEncrypted();
    }, false);

    keyID.addEventListener("input", function() {
        autoSize(this);
        delayedFnKey();
    }, false);


    for(var i = 0; i < launchMainClasses.length; i++) {
        launchMainClasses[i].addEventListener("change", function() {
            main(processID.value);
        }, false)
    }


    //MAIN
    function main(mode) {
        keyID.value = deleteSpaces(keyID.value);
        var keyText = keyID.value;
        var language = languageID.value;

        var Text = sourceID.value.trim();
        /*if(mode === "ENCODE") {
         Text = decryptedAreaID.value.trim();
         } else {
         Text = encryptedAreaID.value.trim();
         }*/


        if(!isKey(language, keyText) || (Text === "")) {
            return;
        }


        var newText = "";
        if(mode === "ENCODE") {
            newText = getEncodedVigenereText(language, Text, keyText);
        } else {
            newText = getDecodedVigenereText(language, Text, keyText);
        }


        outputID.value = newText;
        /*if(mode === "ENCODE") {
         encryptedAreaID.value = newText;
         } else {
         decryptedAreaID.value = newText;
         }*/

        textAreaAdjust(decryptedAreaID);
        textAreaAdjust(encryptedAreaID);


    }

    function cryptanalysisStep1() {
        if(encryptedAreaID.value.trim() === "") {
            return;
        }
        document.getElementById("step-by-step").classList.remove("hidden");

        var VC = new VigenereCryptanalysis(languageID.value, sourceID.value);
        var ICs = VC.getICs();

        document.getElementById("key-length").value = VC.getKeyLength(ICs);

        var columns = "";
        var keyLengths = "";
        var maxIC = Math.max.apply(null, ICs);

        for(var i = 0; i < ICs.length; i++) {
            columns += "<div class=\"column\"><div style=\"height: " +
                (ICs[i] / (maxIC / 100)) + "%\"></div></div>";
            keyLengths += "<span class=\"key-length\">" + (i + 2) + "</span>";
        }


        document.getElementById("columns").innerHTML = columns;
        document.getElementById("key-lengths").innerHTML = keyLengths;

    }

    function cryptanalysisStep2() {
        var keyLength = +document.getElementById("key-length").value;
        if(~~keyLength < 2 || !isNumeric(keyLength)) {
            alert("Введите длинну ключа больше '1'!");
            return;
        }

        var text = sourceID.value;
        var VC = new VigenereCryptanalysis(languageID.value, text);
        var keyWord = VC.getKeyWord(keyLength);

        console.log(htmlID.scrollTop);
        if(htmlID.offsetHeight < htmlID.scrollHeight) {
            htmlID.scrollTop = htmlID.scrollHeight;
        }

        document.getElementById("possible-key").value = keyWord;
        document.getElementById("possible-text").value =
            getDecodedVigenereText(languageID.value, text.substr(0, 200), keyWord)
            + "...";
    }


    //FUNCTIONS

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function makeDelayedFn(fn, delay) {
        var isTimerON = false;

        return function() {
            if(isTimerON) {
                clearTimeout(isTimerON);
            }

            isTimerON = setTimeout(function() {
                fn();
            }, delay)
        }
    }

    function switchArea(A, B) {
        B.disabled = false;
        A.disabled = true;
        B.classList.remove("output");
        B.className += " source";
        A.classList.remove("source");
        A.className += " output";
        B.focus();
    }

    function isKey(lang, key) {
        key = key.trim().toLowerCase();
        if(key === "") {
            return false;
        }
        for(var i = 0; i < key.length; i++) {
            if(!isLetter(lang, key[i])) {
                return false;
            }
        }
        return true;
    }

    function getClearText(lang, text) {
        /*var clearText = "";
         for(var i = 0; i < text.length; i++) {
         if(isLetter(lang, text[i])) {
         clearText += text[i];
         }
         }
         return clearText;*/

        var alphabet = alphabets[lang];
        var re = new RegExp("[^" + alphabet + "]", "gi");

        return text.replace(re, "");
    }

    function isLetter(lang, char) {
        return !!(~alphabets[lang].indexOf(char.toLowerCase()));
    }

    function isUpperCase(char) {
        return !(char === char.toLowerCase());
    }

    function deleteSpaces(str) {
        return str.replace(/\s/g, "");
    }

    function getEncodedVigenereText(lang, text, key) {


        var Alphabet = alphabets[lang];
        var AlphabetLength = Alphabet.length;
        var encodedText = "";
        var keyLength = key.length;
        var currentKeyIndex = 0;


        for(var i = 0; i < text.length; i++) {
            if(!isLetter(lang, text[i])) {
                encodedText += text[i];
                continue;
            }


            var textCharIndex = Alphabet.indexOf(text[i].toLowerCase());
            var keyCharIndex = Alphabet.indexOf(key[currentKeyIndex].toLowerCase());

            if((textCharIndex + keyCharIndex) < AlphabetLength) {
                encodedText += Alphabet[textCharIndex + keyCharIndex];
            } else {
                encodedText
                    += Alphabet[keyCharIndex - (AlphabetLength - textCharIndex)];
            }

            if(isUpperCase(text[i])) {
                encodedText = encodedText.slice(0, -1)
                    + encodedText[i].toUpperCase();
            }

            currentKeyIndex++;
            if(currentKeyIndex > keyLength - 1) {
                currentKeyIndex = 0
            }
        }

        return encodedText;
    }


    function getDecodedVigenereText(lang, text, key) {


        var Alphabet = alphabets[lang];
        var AlphabetLength = Alphabet.length;
        var decodedText = "";
        var keyLength = key.length;
        var currentKeyIndex = 0;


        for(var i = 0; i < text.length; i++) {
            if(!isLetter(lang, text[i])) {
                decodedText += text[i];
                continue;
            }


            var textCharIndex = Alphabet.indexOf(text[i].toLowerCase());
            var keyCharIndex = Alphabet.indexOf(key[currentKeyIndex].toLowerCase());

            if((textCharIndex + keyCharIndex) <= AlphabetLength) {
                if(textCharIndex >= keyCharIndex) {
                    decodedText += Alphabet[textCharIndex - keyCharIndex];
                } else {
                    decodedText += Alphabet[AlphabetLength - keyCharIndex + textCharIndex];
                }

            } else {
                if(textCharIndex >= keyCharIndex) {
                    decodedText += Alphabet[textCharIndex - keyCharIndex];
                } else {
                    decodedText += Alphabet[AlphabetLength - keyCharIndex + textCharIndex];
                }
                // decodedText
                //     += Alphabet[Math.abs(keyCharIndex - textCharIndex)];
            }

            if(isUpperCase(text[i])) {
                decodedText = decodedText.slice(0, -1)
                    + decodedText[i].toUpperCase();
            }

            currentKeyIndex++;
            if(currentKeyIndex > keyLength - 1) {
                currentKeyIndex = 0
            }
        }

        return decodedText;
    }

    function getSplittedText(text, period) {
        var j = 0;
        var splittedText = [];
        var item = "";

        for(var i = 0; i < period; i++) {
            j = i;
            while(text[j]) {
                item += text[j];
                j += period;
            }
            splittedText.push(item);
            item = "";
        }

        return splittedText;
    }

    function countSameLetters(str) {
        var letters = {};

        for(var i = 0; i < str.length; i++) {
            letters[str[i]] = ~~letters[str[i]] + 1;
        }

        return letters;
    }

    function countIC(str) {
        var strLength = str.length;
        var numOfLetters = countSameLetters(str);
        var ic = 0;


        for(var letter in numOfLetters) {
            var num = numOfLetters[letter];
            ic += num * (num - 1) / (strLength * (strLength - 1));
        }


        return ic;
    }

    function getShiSquare(lang, str) {

        var sameLetters = countSameLetters(str);
        var Alphabet = alphabets[lang];
        var strLength = str.length;
        var shiSquares = [];
        var min = 0;

        for(var j = 0; j < Alphabet.length; j++) {

            var shiSquare = 0;
            for(var i = 0; i < Alphabet.length; i++) {
                var offset = i - j;
                if(offset < 0) {
                    offset = Alphabet.length - Math.abs(j - i);
                }
                shiSquare
                    += Math.pow(~~sameLetters[Alphabet[i]]
                        - strLength * lettersFreq[lang][Alphabet[offset]], 2)
                    / (strLength * lettersFreq[lang][Alphabet[offset]]);
            }

            shiSquares.push(shiSquare);
            if(shiSquares[min] > shiSquares[j]) {
                min = j;
            }
        }

        return min;
    }

    function getKeyLengthKasiski(str) {
        var letterCombos = {};

        for(var j = 2; j < 5; j++) {


            for(var i = 0; i < str.length - j; i++) {
                var lastIndex = 0;
                var strSub = str.substr(i, j);


                var temp = 0;
                do {
                    if(temp === 1) {
                        letterCombos[strSub] = [];
                        letterCombos[strSub].push(lastIndex);
                    }

                    if(!temp) {
                        lastIndex = str.indexOf(strSub);
                    } else {
                        lastIndex = str.indexOf(strSub, lastIndex + 1);
                    }


                    if(temp) {
                        letterCombos[strSub].push(lastIndex);
                    }
                    temp++;

                } while(~str.indexOf(strSub, lastIndex + 1)) ;


            }
        }

        var max = null;
        for(var item in letterCombos) {
            if(max === null) {
                max = item;
                continue;
            }

            if(letterCombos[max].length < letterCombos[item].length) {
                max = item;
            }
        }

        var expectedLengths = [];
        var bestCombo = letterCombos[max];

        for(i = 0; i < bestCombo.length; i++) {
            if(!!bestCombo[i + 1]) {
                expectedLengths.push(bestCombo[i + 1] - bestCombo[i]);
            }
        }


        return GCD(expectedLengths);//Math.min.apply(null, expectedLengths);
    }

    function getKeyLengthIC(ICs) {
        var possibleLens = [];
        var avg = getArithmeticMean(ICs);
        var n = 0;
        var highest = deleteIdLowestElems([], avg, ICs);
        var i = 1.2;
        var gcd = 0;

        while((n !== 300 ) && (highest.length > 2)) {
            gcd = GCD(highest);
            if((gcd > 2) && !(~possibleLens.indexOf(gcd))) {
                possibleLens.push(gcd);
            }
            var lastHighestLen = highest.length;
            highest = deleteIdLowestElems(highest, avg * i, ICs);
            i += 0.0005;
            if(lastHighestLen === highest.length) {
                n++;
            } else {
                n = 0;
            }

        }
        var gcdPossible = GCD(possibleLens);
        var gcdHighest = GCD(highest);

        return (gcdPossible > gcdHighest) ? gcdHighest :
            (gcdPossible > 1) ? gcdPossible : gcdHighest;
    }

    function deleteIdLowestElems(A, min, ICs) {
        var i;
        var Offset = 2;

        if(!A.length) {
            for(i = 0; i < ICs.length; i++) {
                A.push(i + Offset);
            }
        }


        var highestElems = [];

        for(i = 0; i < A.length; i++) {
            if(ICs[A[i] - Offset] > min) {
                highestElems.push(A[i]);
            }
        }

        return highestElems;
    }

    function getArithmeticMean(A) {
        var sum = 0;
        for(var i = 0; i < A.length; i++) {
            sum += A[i];
        }

        return sum / i;
    }

    function shiftStr(str, offset) {
        return str.slice(offset, str.length) + str.slice(0, offset);
    }

    function GCD(A) {
        var n = A.length, x = Math.abs(A[0]);
        for(var i = 1; i < n; i++) {
            var y = Math.abs(A[i]);
            while(x && y) {
                x > y ? x %= y : y %= x;
            }
            x += y;
        }
        return x;
    }

    function VigenereCryptanalysis(lang, text) {

        var Alphabet = alphabets[lang];
        var clearText = getClearText(lang, text).toLowerCase();
        this.avgICs = [];
        var maxICPeriod = 0;

        if(Math.floor(clearText.length / 2) > MAXKEYLN) {
            maxICPeriod = MAXKEYLN;
        } else {
            maxICPeriod = Math.floor(clearText.length / 2);
        }


        this.getICs = function() {


            for(var j = 2; j < maxICPeriod; j++) {


                var splittedText = getSplittedText(clearText, j);


                var avgICTemp = 0;


                for(var i = 0; i < splittedText.length; i++) {

                    avgICTemp += countIC(splittedText[i]);

                }

                this.avgICs.push(avgICTemp / i);

            }


            return this.avgICs;
        };

        this.getKeyLength = function(ICs) {
            this.res = 0;
            var Kasiski = getKeyLengthKasiski(clearText);

            if(Kasiski > 2) {
                this.res = Kasiski;
                return this.res;
            } else {
                this.res = getKeyLengthIC(ICs);
                return ~~this.res;
            }
        };

        this.getKeyWord = function(keyLength) {
            var splittedText = getSplittedText(clearText, keyLength);
            var keyWord = "";

            for(var i = 0; i < keyLength; i++) {
                keyWord += Alphabet[getShiSquare(lang, splittedText[i])];
            }

            this.res = keyWord;

            return this.res;
        }

    }

    //STYLES

    function autoSize(o) {
        var minSize = 6;
        var offset = 4;
        if(o.value.trim() === "") {
            if(!!o.placeholder && o.placeholder > minSize) {
                o.size = o.placeholder.length + offset;
            } else {
                o.size = minSize + offset;
            }

        } else {
            if(o.value.length > minSize) {
                o.size = o.value.length + offset;
            } else {
                o.size = minSize + offset;
            }
        }
    }

    function textAreaAdjust(o) {

        o.style.height = "";

        if((o.offsetHeight ) < o.scrollHeight) {
            o.style.height = ( o.scrollHeight) + "px";
        }

        return o.style.height;
    }


})();
