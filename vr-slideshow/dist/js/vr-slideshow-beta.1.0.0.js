/*                                                                                  
          _____                                              
         |\    \                                         
         |:\    \                                             
         |::\____\                                     
         |::|    |                                       
         |::|    |                          
         |::|    |                                     
         |::|    |                           
         |::|    |                                    
         |::|    |                                        
         |::|    |  _____                         
         |::|    | /\    \                   
         |::|    |/::\    \                  
         |::|    /::::\    \                 
         |::|   /::::::\    \                
         |::|  /:::/\:::\    \
         |::| /:::/__\:::\    \
         |::|/::::\   \:::\    \
         |:::::::::\   \:::\    \
         |:::::/\:::\   \:::\____\           
         \::::/  \:::\   \:::|    |          
          \::/   |::::\  /:::|____|          
           \/____|:::::\/:::/    /             
                 |:::::::::/    /             
                 |::|\::::/    /             
                 |::| \::/____/                 
                 |::|  ~|            
                 |::|   |                      
                 \::|   |                      
                  \:|   |                      
                   \|___|

*/

(function ($, window, document, undefined) {

    var pluginName = "vrSlideshow",
        defaults = {
            sliderDesign: "hero",
            fillUp: true,
            // The units must constain the following structure:
            // - { imagePath: "../image.jpg" } or
            // - { imagePath: "../image.jpg", title: "Hello, world!" }
            data =[],
            slideWidth: null,
            customCssClasses: [],
            nextBtn: null,
            prevBtn: null,
            autostart: true,
            pauseOnHover: true,
            duration: 2000,
            delay: 6000,
            direction: null, // -1 = left, 1 = right
            showJumpLinks: true,
            clickNext: function () { },
            clickPrev: function () { },
            moving: function () { },
            hasMoved: function () { },
            movingNext: function () { },
            movingPrev: function () { },
            start: function () { },
            stop: function () { },
            pause: function () { },
            unpause: function () { }
        },

        // Design options for each slider type
        sliderDesign = {
            hero: {
                className: "cs_ss__hero",
                slideWidth: 1
            },
            multiSlide: {
                className: "cs_ss__multi-slide",
                slideWidth: 1

            }

        }

    /**
     * @constructor
     * The actual plugin constructor.
     * @param {any} element The slideshow node element.
     * @param {any} options The custom plugin options to override.
     */
    function Plugin(element, options) {
        this.el = element;
        this.$el = $(element);
        this.options = $.extend({}, defaults, options);
        this.designOptions = sliderDesign;
        this.isSetUp = false;
        this.isFilledUp = false;
        this.moveInterval;
        this.state = 0;
        this.paused = 0;
        this.moving = 0;

        this._defaults = defaults;
        this._name = pluginName;
        this._direction = null;
        this._container = null;
        this._jumpLinks = null;

        if (this.el.nodeName == "SLIDESHOW") {
            this.normailizeDirection();
            this.init();
        }
    }

    // Defining the prototype structure
    Plugin.prototype = {

        /**
         * The actual plugin initializer
         */
        init: function () {
            this.options.fillUp && this.fillUp();
            this.setUp();
            this.options.showJumpLinks && this.setJumpLinks();

            this._posX1 = 0;
            this._posX2 = 0;
            this._posInitial = null;
            this._posFinal = null;
            this._threshold = 100;
            this._slides = this._container.querySelectorAll(".cs_ss__slide-item");
            this._slidesLength = this._slides.length;
            this._slideSize = this._slides[0].offsetWidth;
            this._firstSlide = this._slides[0];
            this._lastSlide = this._slides[this._slidesLength - 1];
            this._cloneFirst = this._firstSlide.cloneNode(true);
            this._cloneLast = this._lastSlide.cloneNode(true);
            this._index = this.getDirection() == "left" ? 0 : this._slidesLength - 1;
            this._allowShift = true;

            // Clone first and last slide
            this._container.appendChild(this._cloneFirst);
            this._container.insertBefore(this._cloneLast, this._firstSlide);
            this.el.classList.add("loaded");

            // Get slides length with the cloned ones
            this._clonedSlidesLength = this._container.querySelectorAll(".cs_ss__slide-item");

            // Mouse events
            this._container.onmousedown = this.dragStart.bind(this);

            // Touch events
            this._container.addEventListener("touchstart", this.dragStart.bind(this));
            this._container.addEventListener("touchmove", this.dragAction.bind(this));
            this._container.addEventListener("touchend", this.dragEnd.bind(this));

            // Window resize events
            window.addEventListener("resize", this.resetDimensions.bind(this));

            // Pause on hover
            if (this.options.pauseOnHover) {
                this.$el.hover(function () {
                    if (this.state)
                        this.pause();
                }.bind(this), function () {
                    if (this.state)
                        this.unpause();
                }.bind(this));
            }

            if (this.options.autostart)
                this.start();
        },

        /**
         * Stars the animation by setting interval.
         */
        start: function () {
            if (!this.state) {
                this.state = 1;
                this.resetInterval();
                this.options.start();
            }
        },

        /**
         * Stops the animation by clearing the existed moving interval.
         */
        stop: function () {
            if (this.state) {
                clearInterval(this.moveInterval);
                this.state = 0;
                this.options.stop();
            }
        },

        /**
         * Sets or resets the animation interval.
         */
        resetInterval: function () {
            if (this.state) {
                clearInterval(this.moveInterval);
                this.moveInterval = setInterval(this.move.bind(this), this.options.duration);
            }
        },

        /**
         * Moves the slider one step forward, if the animation isn't paused.
         */
        move: function () {
            if (!this.paused) this.moveNext();
        },

        /**
         * Pauses the running animation.
         */
        pause: function () {
            if (!this.paused) this.paused = 1;
            this.options.pause();
        },

        /**
         * Unpauses the paused animation.
         */
        unpause: function () {
            if (this.paused) this.paused = 0;
            this.options.unpause();
        },

        /**
         * Fills up the container with the data, if any.
         */
        fillUp: function () {
            if (this.isSetUp) return;

            const wrapper = document.createElement("wrapper");
            this.el.appendChild(wrapper);

            this._container = document.createElement("container");
            ul.classList.add("cs_ss__constainer");
            wrapper.appendChild(this._container);

            this.options.data.forEach(function (unit) {
                const slideItem = document.createElement("div");
                slideItem.classList.add("cs_ss__slide-item");
                this._container.appendChild(slideItem);

                const img = document.createElement("img");
                img.setAttribute("src", unit.imagePath != undefined && unit.imagePath != null ? unit.imagePath : "");
                slideItem.appendChild(img);

                if (unit.title != undefined && unit.title != null) {
                    const title = document.createElement("title");
                    title.innerHTML = unit.title;
                    slideItem.appendChild(title);
                }
            });
        },

        /**
         * Sets up the design and the functionality for the slider.
         */
        setUp: function () {
            this.el.classList.add(this.designOptions[this.options.sliderDesign].className);

            if (!this.isFilledUp) {
                this._container = this.el.querySelector("container");
                this._container.classList.add("cs_ss__container");
            }

            const slideItems = this.el.querySelectorAll(".cs_ss__container > div");
            for (let i = 0; i < slideItems.length; i++) {
                slideItems[i].classList.add("cs_ss__slide-item");
                slideItems[i].setAttribute("order", i);
                slideItems[i].style.width = this.el.offsetWidth + "px";
            }

            this._container.style.width = (slideItems.length * this.el.offsetWidth + this.el.offsetWidth * 2) + "px";

            if (this.getDirection() == "left") {
                this._container.style.left = -this.el.offsetWidth + "px";
            } else {
                this._container.style.left = -(this.el.offsetWidth * slideItems.length) + "px";
            }

            // Set the next button
            const next = this.options.nextBtn == null
                ? document.createElement("div")
                : this.element.querySelector(this.options.nextBtn);

            next.classList.add("cs_ss__control", "cs_ss__control-next");
            next.addEventListener("click", this.moveNext.bind(this));
            this.el.appendChild(next);

            // Set the previous button.
            const prev = this.options.prevBtn == null
                ? document.createElement("div")
                : this.element.querySelector(this.options.prevBtn);

            prev.classList.add("cs_ss__control", "cs_ss__control-prev");
            prev.addEventListener("click", this.movePrev.bind(this));
            this.el.appendChild(prev);
        },

        /**
         * Adds jump links to the slidershow.
         */
        setJumpLinks: function () {
            this._jumpLinks = document.createElement("div");
            this._jumpLinks.classList.add("cs_ss__jump-links");
            this.el.appendChild(this._jumpLinks);

            var slidesLength = this._container.childElementCount;

            for (let i = 0; i < slidesLength; i++) {
                const circle = document.createElement("span");
                var linkFor = i;

                if (i == slidesLength - 1) {
                    circle.classList.add("active");
                    linkFor = -1;
                }
                circle.setAttribute("link-for", linkFor);
                this._jumpLinks.appendChild(circle);
            }
        },

        /**
         * Records the start coordinates.
         * @param {AbortSignalEventMap} e The "touchstart" event map.
         */
        dragStart: function (e) {
            e = e || window.event;
            e.preventDefault();

            this._posInitial = this._container.offsetLeft;

            if (e.type == "touchstart") {
                this._posX1 = e.touches[0].clientX;
            } else {
                this._posX1 = e.clientX;
                document.onmouseup = this.dragEnd.bind(this);
                document.onmousemove = this.dragAction.bind(this);
            }
        },

        /**
         * Moves the slides as the mouse moves.
         * @param {AbortSignalEventMap} e The "touchmove" event map.
         */
        dragAction: function (e) {
            e = e || window.event;

            if (e.type == "touchmove") {
                this._posX2 = this._posX1 - e.touches[0].clientX;
                this._posX1 = e.touches[0].clientX;
            } else {
                this._posX2 = this._posX1 - e.clientX;
                this._posX1 = e.clientX;
            }
            this._container.style.left = (this._container.offsetLeft - this._posX2) + "px";
        },

        /**
         * Sets the final coordinates.
         * @param {AbortSignalEventMap} e The "touchend" event map.
         */
        dragEnd: function (e) {
            this._posFinal = this._container.offsetLeft;

            if (this._posFinal - this._posInitial < -this._threshold) {
                this.shiftSlide(1, "drag");
            } else if (this._posFinal - this._posInitial > this._threshold) {
                this.shiftSlide(-1, "drag");
            } else {
                this._container.style.left = (this._posInitial) + "px";
            }

            document.onmouseup = null;
            document.onmousemove = null;
        },

        /**
         * Shifts the slide by the specified direction.
         * @param {number} dir The direction to shift to (1 or -1).
         * @param {string} action The action.
         */
        shiftSlide: function (dir, action) {
            this._container.style.transition = "left " + (this.options.duration / 1000) + "s ease-out";

            if (this._allowShift) {
                this.options.moving();
                if (!action) { this._posInitial = this._container.offsetLeft; }

                if (dir == 1) {
                    this.options.movingNext();
                    this._container.style.left = (this._posInitial - this._slideSize) + "px";
                    this._index++;
                } else if (dir == -1) {
                    this.options.movingPrev();
                    this._container.style.left = (this._posInitial + this._slideSize) + "px";
                    this._index--;
                }
                console.log(this._index);
                this.nextLink();
                setTimeout(this.checkIndex.bind(this), this.options.duration);
            };
            this._allowShift = false;
        },

        /**
         * Checks and updates the current index.
         */
        checkIndex: function () {
            this.options.hasMoved();
            this._container.style.transition = "none";

            if (this._index == -1) {
                this._container.style.left = -(this._slidesLength * this._slideSize) + "px";
                this._index = this._slidesLength - 1;
            }

            if (this._index == this._slidesLength) {
                this._container.style.left = -(1 * this._slideSize) + "px";
                this._index = 0;
            }

            this._allowShift = true;
        },

        /**
         * Resets the dimensions of the slider elements as the window gets resized.
         */
        resetDimensions: function () {
            this.pause(); // Pause moving until resizing is finished
            this.resizeTimer != undefined && clearTimeout(this.resizeTimer);

            // Reset container's offset left
            this.offsetLeftSetter();

            // Reset container's dimensions
            this.containerSetter();

            // Reset slides' dimensions
            this.slidesSetter();

            // Unpause moving once resizing is done
            this.resizeTimer = setTimeout(this.unpause.bind(this), 5000);
        },

        /**
         * Resets the container's offsetLeft value.
         */
        offsetLeftSetter: function () {
            var leftLength = this._container.offsetLeft / (this._container.offsetWidth / (this._slidesLength + 2))

            leftLength = leftLength > 0
                ? Math.round(leftLength)
                : -Math.round(Math.abs(leftLength));

            this._container.style.left = (leftLength * this.el.offsetWidth) + "px";
        },

        /**
         * Resets the container's dimensions.
         */
        containerSetter: function () {
            this._container.style.width = (this._slidesLength * this.el.offsetWidth + this.el.offsetWidth * 2) + "px";
        },

        /**
         * Resets the slides' dimensions.
         */
        slidesSetter: function () {
            this._clonedSlidesLength
                .forEach(function (slide) {
                    slide.style.width = this.el.offsetWidth + "px";
                }.bind(this));

            this._slideSize = this._slides[0].offsetWidth;
        },

        /**
         * Normalizes the horizantal scroll direction.
         */
        normailizeDirection: function () {
            if (this.options.direction == null) {

                const siteLang = document.querySelector("html").getAttribute("lang");
                this._direction = siteLang == null || siteLang.toLowerCase() != "ar" ? -1 : 1;
            } else {
                this._direction = this.options.direction;
            }
        },

        /**
         * Gets the current direction as string.
         */
        getDirection: function () {
            return this._direction == 1 ? "right" : "left";
        },

        /**
         * Moves the slider one step forward (based on the site direction).
         */
        moveNext: function () {
            this.shiftSlide(-1);
            this.options.clickNext();
        },

        /**
         * Moves the slider one step back (based on the site direction).
         */
        movePrev: function () {
            this.shiftSlide(1);
            this.options.clickPrev();
        },

        /**
         * Updates the active jump link item.
         */
        nextLink: function () {
            const active = this._jumpLinks.querySelector("span.active");
            if (active != null) {
                active.classList.remove("active");
            }

            const target = this._jumpLinks.querySelector(`span[link-for="${this._index}"]`);
            if (target != null) {
                target.classList.add("active");
            }
        },

        destroy: function () {
            this._destroy(); //or this.delete; depends on jQuery version
        }
    }

    /**
     * A really lightweight plugin wrapper around the cnstructor,
     * preventing against multiple instantiations.
     * @param {any} option The plugin option(s).
     */
    $.fn[pluginName] = function (option) {
        var args = arguments;

        return this.each(function () {
            var $this = $(this),
                data = $.data(this, "plugin_" + pluginName),
                options = typeof option === "object" && option;

            if (!data) {
                $this.data("plugin_" + pluginName, (data = new Plugin(this, options)));
            }

            // If first argument is a string, call silimarly named function.
            // This gives flexibility to call functions of the plugin
            // e.g. $("#slideshow").Plugin("distroy");
            if (typeof option === "string") {
                data[option].apply(data, Array.prototype.slice.call(args, 1));
            }
        });
    }

})(jQuery, window, document);
