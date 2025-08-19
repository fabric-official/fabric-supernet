# Simple Vite dev container for Supernet dashboard

RUN apk add --no-cache curl
COPY . .
ENV HOST=0.0.0.0
ENV PORT=5173
EXPOSE 5173
# If you use Vite, this works; otherwise change start command accordingly
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5173","--strictPort"]

