#pragma once

#include <nan.h>

#include <random>
#include <vector>

namespace demo {

template <class Dest, class Source>
inline Dest bit_cast(Source const& source) {
    static_assert(sizeof(Dest) == sizeof(Source),
                  "source and dest must be same size");
    Dest dest;
    memcpy(&dest, &source, sizeof(dest));
    return dest;
}


class GLProxyManager : public Nan::ObjectWrap
{
public:
    static NAN_MODULE_INIT(Init);

private:
    GLProxyManager() : bufsize_(0), bufid_(-1), index_(1234) {}
    ~GLProxyManager() = default;

    static NAN_METHOD(New);

    // static NAN_METHOD(GetValue);

    // Set manager object
    static NAN_METHOD(SetManager);

    // Initialization
    static NAN_METHOD(Create);

    // Render
    static NAN_METHOD(Render);

    // ctor ??
    static Nan::Persistent<v8::Function> constructor;

    int bufsize_;
    std::vector<float> buffer_;

    int bufid_;
    Nan::Persistent<v8::Object> mgr_;

    /////
    std::mt19937 rng_;

    static inline float clamp(float min, float max, float val)
    {
        return std::min<float>(std::max<float>(min, val), max);
    }

    // unsigned long index_;
    unsigned int index_;

    // inline float randomUniform()
    // {
    //     index_ = 48271U * index_ % 0xFFFFFFFF;
    //     // index_ = index_ + 12345;
    //     float rnd = float(index_) / float(0xFFFFFFFF);
    //     return rnd - 0.5;

    //     // return 0.0f;
    //     // return float(rand()) / float(RAND_MAX);
    //     // std::uniform_real_distribution<double> score(-0.5, 0.5);
    //     // return score(rng_);
    // }

    // uint64_t s[2] = { (uint64_t(rd()) << 32) ^ (rd()),
    //                   (uint64_t(rd()) << 32) ^ (rd()) };
    uint64_t s[2] = { 1234567890, 987654321 };
    
    uint64_t xorshift128plus(void) {
        uint64_t x = s[0];
        uint64_t const y = s[1];
        s[0] = y;
        x ^= x << 23; // a
        s[1] = x ^ y ^ (x >> 17) ^ (y >> 26); // b, c
        return s[1] + y;
    }

    inline double randomUniform()
    {
        uint64_t v = xorshift128plus();

        static const uint64_t kExponentBits = 0x3FF0000000000000UL;
        static const uint64_t kMantissaMask = 0x000FFFFFFFFFFFFFUL;
        uint64_t random = (v & kMantissaMask) | kExponentBits;
        return (bit_cast<double>(random) - 1) - 0.5;
    }        

    constexpr static int VERTEX_SIZE = 3;  // vec3
    constexpr static int COLOR_SIZE = 4;   // vec4
    constexpr static int STRIDE_SIZE = VERTEX_SIZE + COLOR_SIZE;
    
    constexpr static int VERTEX_NUMS = 6 * 1000 * 1000;
    constexpr static int TRIANGLE_NUMS = VERTEX_NUMS / 3;
    constexpr static float scl = 0.1f;

    inline void updateData(float *pbuf)
    {
        for (size_t i = 0; i < VERTEX_NUMS; ++i) {
        // for (size_t i = 0; i < VERTEX_NUMS/2; ++i) {
            const int bias = STRIDE_SIZE * i;
            pbuf[bias + 0] += randomUniform() * scl;
            pbuf[bias + 1] += randomUniform() * scl;
            pbuf[bias + 2] += randomUniform() * scl;

            pbuf[bias + 3] = clamp(0, 1, randomUniform() * 0.1 + pbuf[bias + 3]);
            pbuf[bias + 4] = clamp(0, 1, randomUniform() * 0.1 + pbuf[bias + 4]);
            pbuf[bias + 5] = clamp(0, 1, randomUniform() * 0.1 + pbuf[bias + 5]);
        }
    }
};

}  // namespace demo
